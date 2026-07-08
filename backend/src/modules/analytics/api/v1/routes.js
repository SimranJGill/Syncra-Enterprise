import express from 'express';
import { dbAll, dbGet, dbRun } from '#@/core/database.js';
import { authenticateToken } from '#@/core/middleware/auth.js';

const router = express.Router();

// GET all attrition risks
router.get('/attrition-risk', authenticateToken, async (req, res) => {
  try {
    const list = await dbAll(`
      SELECT er.*, u.name as employee_name, o.name as department_name
      FROM employee_risk_profiles er
      JOIN employees e ON er.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN organizations o ON e.department_id = o.id
      ORDER BY er.attrition_risk_score DESC
    `);
    res.status(200).json({
      risks: list.map(item => ({
        ...item,
        risk_factors: JSON.parse(item.risk_factors || '[]')
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET specific risk profile
router.get('/attrition-risk/:id', authenticateToken, async (req, res) => {
  try {
    const record = await dbGet('SELECT * FROM employee_risk_profiles WHERE employee_id = ?', [req.params.id]);
    if (!record) {
      // Seed dynamically if missing for simplicity
      const dummyFactors = JSON.stringify([
        { factor: 'Absenteeism Spike', weight: 0.25, value: 0.2 },
        { factor: 'Performance decline', weight: 0.20, value: 0.3 },
        { factor: 'Overtime Burnout', weight: 0.20, value: 0.4 }
      ]);
      const initialScore = 18; // default mock calculation
      await dbRun(
        'INSERT INTO employee_risk_profiles (employee_id, attrition_risk_score, risk_factors, trend) VALUES (?, ?, ?, "stable")',
        [req.params.id, initialScore, dummyFactors]
      );
      return res.status(200).json({
        riskProfile: {
          employee_id: req.params.id,
          attrition_risk_score: initialScore,
          risk_factors: JSON.parse(dummyFactors),
          trend: 'stable'
        }
      });
    }
    res.status(200).json({ riskProfile: { ...record, risk_factors: JSON.parse(record.risk_factors || '[]') } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST "What-If" simulator scenario runner
router.post('/simulate', authenticateToken, async (req, res) => {
  const { scenarioType, variables } = req.body;
  try {
    let projectedOutcomes = {};

    if (scenarioType === 'hiring') {
      const added = parseInt(variables.count || 0);
      const avgCost = 5000;
      projectedOutcomes = {
        capacityIncrease: `${added * 40} hours/week`,
        costImpact: `+$${added * avgCost}/month`,
        riskSpike: '0% (Morale Stabilized)'
      };
    } else if (scenarioType === 'leave_storm') {
      const pendingApproved = parseInt(variables.pendingCount || 5);
      projectedOutcomes = {
        coverageGaps: `${pendingApproved * 2} days critical gaps`,
        overtimeSpike: `+${pendingApproved * 8}% projected team overtime`,
        costSpike: `+$${pendingApproved * 300} backup contractor fees`
      };
    } else if (scenarioType === 'resignation') {
      const targetEmpName = variables.employeeName || 'Lead Tech';
      projectedOutcomes = {
        skillLoss: 'High-risk gaps detected in node.js, docker containerization',
        moraleHit: 'Moderate risk impact on reporting sub-teams',
        recommendedReplacements: ['Senior Dev Bob (85% match)', 'Engineer Alice (72% match)']
      };
    } else if (scenarioType === 'budget') {
      const reduction = parseFloat(variables.percentage || 10);
      projectedOutcomes = {
        burnoutMoraleHit: `+${reduction * 1.5}% predicted attrition risk spike`,
        payrollSavings: `-$${reduction * 1200} saved monthly`,
        turnoverEstimate: `+${Math.ceil(reduction / 5)} employee resignation signals`
      };
    }

    // Persist scenario history
    const ins = await dbRun(
      'INSERT INTO what_if_scenarios (scenario_name, created_by, scenario_type, variables, projected_outcomes) VALUES (?, ?, ?, ?, ?)',
      [`Simulation_${scenarioType}_${Date.now()}`, req.user.id, scenarioType, JSON.stringify(variables), JSON.stringify(projectedOutcomes)]
    );

    res.status(200).json({ id: ins.id, projectedOutcomes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
