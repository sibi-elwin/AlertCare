const { prisma } = require('../prisma/client');

/**
 * Get patient dashboard data
 * Aggregates current score, trajectory, guidance, and recent changes
 */
async function getPatientDashboard(patientId) {
  // Get patient info
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Get latest prediction (current score)
  const latestPrediction = await prisma.healthPrediction.findFirst({
    where: { patientId },
    orderBy: { timestamp: 'desc' },
  });

  // Get predictions for last 30 days for trajectory
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const predictions = await prisma.healthPrediction.findMany({
    where: {
      patientId,
      timestamp: { gte: thirtyDaysAgo },
    },
    orderBy: { timestamp: 'asc' },
    select: {
      timestamp: true,
      healthStabilityScore: true,
      riskCategory: true,
    },
  });

  // Calculate trend (compare last 5 days average with previous 5 days)
  let trend = 'stable';
  let changePercent = 0;
  if (predictions.length >= 10) {
    const last5 = predictions.slice(-5);
    const prev5 = predictions.slice(-10, -5);
    const last5Avg = last5.reduce((sum, p) => sum + p.healthStabilityScore, 0) / 5;
    const prev5Avg = prev5.reduce((sum, p) => sum + p.healthStabilityScore, 0) / 5;
    changePercent = ((last5Avg - prev5Avg) / prev5Avg) * 100;
    
    if (changePercent > 2) trend = 'up';
    else if (changePercent < -2) trend = 'down';
    else trend = 'stable';
  }

  // Format trajectory data (daily aggregation)
  const trajectoryMap = new Map();
  predictions.forEach((pred) => {
    const dateKey = pred.timestamp.toISOString().split('T')[0];
    const day = new Date(pred.timestamp).getDate().toString().padStart(2, '0');
    
    if (!trajectoryMap.has(dateKey)) {
      trajectoryMap.set(dateKey, {
        day,
        date: dateKey,
        score: pred.healthStabilityScore,
        riskCategory: pred.riskCategory,
      });
    } else {
      // Average if multiple predictions per day
      const existing = trajectoryMap.get(dateKey);
      existing.score = (existing.score + pred.healthStabilityScore) / 2;
    }
  });

  const trajectory = Array.from(trajectoryMap.values());

  // Get unacknowledged guidance
  let guidance = [];
  try {
    // Check if careTeamGuidance model exists in Prisma client
    if (prisma.careTeamGuidance) {
      guidance = await prisma.careTeamGuidance.findMany({
        where: {
          patientId,
          acknowledged: false,
        },
        include: {
          caregiver: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          doctor: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    } else {
      console.warn('careTeamGuidance model not available in Prisma client. Run: npx prisma generate');
    }
  } catch (error) {
    console.error('Error fetching guidance:', error);
    // Continue with empty array - guidance is optional
  }

  // Format guidance
  const formattedGuidance = guidance.map((g) => ({
    id: g.id,
    message: g.message,
    author: g.doctor
      ? `${g.doctor.firstName || ''} ${g.doctor.lastName || ''}`.trim() || 'Doctor'
      : g.caregiver
      ? `${g.caregiver.firstName || ''} ${g.caregiver.lastName || ''}`.trim() || 'Caregiver'
      : 'Care Team',
    authorType: g.doctor ? 'doctor' : 'caregiver',
    timestamp: g.createdAt.toISOString(),
    acknowledged: g.acknowledged,
  }));

  // Get recent changes (compare last 7 days with previous 7 days)
  let recentChanges = null;
  if (predictions.length >= 14) {
    const last7 = predictions.slice(-7);
    const prev7 = predictions.slice(-14, -7);
    
    // Simple heuristic: calculate average score change
    const last7Avg = last7.reduce((sum, p) => sum + p.healthStabilityScore, 0) / 7;
    const prev7Avg = prev7.reduce((sum, p) => sum + p.healthStabilityScore, 0) / 7;
    const change = last7Avg - prev7Avg;
    
    if (Math.abs(change) > 1) {
      recentChanges = {
        message: change > 0
          ? `Your health stability has improved by ${change.toFixed(1)} points over the last week.`
          : `Your health stability has decreased by ${Math.abs(change).toFixed(1)} points over the last week.`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  return {
    patient: {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.user.email,
    },
    currentScore: {
      healthStabilityScore: latestPrediction?.healthStabilityScore || null,
      riskCategory: latestPrediction?.riskCategory || null,
      timestamp: latestPrediction?.timestamp.toISOString() || null,
      trend,
      changePercent: Math.round(changePercent * 10) / 10,
    },
    trajectory,
    guidance: formattedGuidance,
    recentChanges,
  };
}

/**
 * Get trajectory data for a patient
 */
async function getPatientTrajectory(patientId, days = 30, granularity = 'daily') {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const predictions = await prisma.healthPrediction.findMany({
    where: {
      patientId,
      timestamp: { gte: startDate },
    },
    orderBy: { timestamp: 'asc' },
    select: {
      timestamp: true,
      healthStabilityScore: true,
      riskCategory: true,
    },
  });

  if (granularity === 'weekly') {
    // Group by week
    const weeklyMap = new Map();
    predictions.forEach((pred) => {
      const date = new Date(pred.timestamp);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          date: weekKey,
          scores: [],
          riskCategories: [],
        });
      }
      weeklyMap.get(weekKey).scores.push(pred.healthStabilityScore);
      weeklyMap.get(weekKey).riskCategories.push(pred.riskCategory);
    });

    return Array.from(weeklyMap.entries()).map(([date, data]) => ({
      date,
      score: data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length,
      riskCategory: data.riskCategories[Math.floor(data.riskCategories.length / 2)], // Median
    }));
  } else {
    // Daily aggregation
    const dailyMap = new Map();
    predictions.forEach((pred) => {
      const dateKey = pred.timestamp.toISOString().split('T')[0];
      const day = new Date(pred.timestamp).getDate().toString().padStart(2, '0');
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          day,
          date: dateKey,
          scores: [],
          riskCategories: [],
        });
      }
      dailyMap.get(dateKey).scores.push(pred.healthStabilityScore);
      dailyMap.get(dateKey).riskCategories.push(pred.riskCategory);
    });

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      day: data.day,
      date,
      score: data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length,
      riskCategory: data.riskCategories[Math.floor(data.riskCategories.length / 2)],
    }));
  }
}

module.exports = {
  getPatientDashboard,
  getPatientTrajectory,
};

