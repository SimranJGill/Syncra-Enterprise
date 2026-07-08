import { Router } from 'express';
import { dbGet, dbAll, dbRun } from '#@/core/database';
import { authenticateToken } from '#@/core/middleware/auth';

const router = Router();

// GET all user's conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const convs = await dbAll('SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.status(200).json({ conversations: convs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET messages of a conversation
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await dbAll('SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC', [req.params.id]);
    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST query / conversation chat entry point
router.post('/query', authenticateToken, async (req, res) => {
  const { query, activeTab, conversationId } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Query parameter is required.' });
  }

  const userQuery = query.toLowerCase();

  try {
    let contextData = '';
    let isTable = false;
    let finalConvId = conversationId;

    // Persist or retrieve conversation session
    if (!finalConvId) {
      const title = query.substring(0, 30) + '...';
      const convResult = await dbRun('INSERT INTO ai_conversations (user_id, title) VALUES (?, ?)', [req.user.id, title]);
      finalConvId = convResult.id;
    }

    // Save User message
    await dbRun('INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, "user", ?)', [finalConvId, query]);

    // 1. Contextual awareness prefix
    let contextualPrefix = '';
    if (activeTab) {
      contextualPrefix = `*Context: I see you are currently inspecting the **${activeTab.toUpperCase()}** management hub.* \n\n`;
    }

    // 2. Intent parsing & dynamic database search tools
    if (userQuery.includes('policy') || userQuery.includes('document') || userQuery.includes('rag')) {
      // Document Search (M-12) with server-side visibility restrictions
      const emp = await dbGet('SELECT department_id FROM employees WHERE user_id = ?', [req.user.id]);
      const userDept = emp ? emp.department_id : null;
      const userRole = req.user.role;

      const docs = await dbAll(`
        SELECT title, category, version, file_url, visibility 
        FROM documents 
        WHERE visibility = 'org-wide'
           OR (visibility = 'department-specific' AND CAST(target_id AS INTEGER) = ?)
           OR (visibility = 'role-restricted' AND target_id = ?)
      `, [userDept, userRole]);

      contextData = `
### 📁 Document RAG Search
Here are the policy files you are permitted to view:

| Title | Category | Version | Visibility | Link |
| :--- | :--- | :--- | :--- | :--- |
${docs.map(d => `| ${d.title} | ${d.category} | ${d.version} | ${d.visibility} | [Open PDF](${d.file_url}) |`).join('\n')}
      `.trim();
      isTable = true;
    } 
    else if (userQuery.includes('salary') || userQuery.includes('payroll') || userQuery.includes('payslip')) {
      // Payroll Explainer (M-07) - RBAC checked
      let payrollData = [];
      if (req.user.role === 'Admin' || req.user.role === 'Super Admin' || req.user.role === 'HR') {
        payrollData = await dbAll(`
          SELECT p.*, e.name as employee_name 
          FROM payrolls p
          JOIN employees e ON p.employee_id = e.id
          LIMIT 10
        `);
      } else {
        const empRecord = await dbGet('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
        if (empRecord) {
          payrollData = await dbAll('SELECT * FROM payrolls WHERE employee_id = ?', [empRecord.id]);
        }
      }

      contextData = `
### 💵 Payroll Cost Summary
| Employee / ID | Month | Gross Pay | Tax deductions | Net Pay | Payslip |
| :--- | :--- | :--- | :--- | :--- | :--- |
${payrollData.map(p => `| ${p.employee_name || 'Personal'} | ${p.month} | $${p.basic_salary} | $${p.income_tax} | $${p.net_salary} | [Download PDF](#) |`).join('\n')}
      `.trim();
      isTable = true;
    } 
    else if (userQuery.includes('attendance') || userQuery.includes('clock')) {
      // Attendance (M-05) summary
      const attendance = await dbAll(`
        SELECT a.date, a.status, e.name as employee_name 
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        ORDER BY a.date DESC LIMIT 10
      `);

      contextData = `
### ⏱️ Attendance Audit Log
| Date | Employee | Status |
| :--- | :--- | :--- |
${attendance.map(a => `| ${a.date} | ${a.employee_name} | ${a.status} |`).join('\n')}
      `.trim();
      isTable = true;
    } 
    else if (userQuery.includes('leave') || userQuery.includes('vacation')) {
      // Leave Assistant (M-06)
      const leaves = await dbAll(`
        SELECT lr.*, e.name as employee_name 
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
        ORDER BY lr.created_at DESC LIMIT 10
      `);

      contextData = `
### 📅 Leave Requests Pipeline
| Employee | Leave Type | Duration | Status |
| :--- | :--- | :--- | :--- |
${leaves.map(l => `| ${l.employee_name} | ${l.leave_type} | ${l.start_date} to ${l.end_date} | ${l.status} |`).join('\n')}
      `.trim();
      isTable = true;
    } 
    else if (userQuery.includes('project') || userQuery.includes('task') || userQuery.includes('kanban')) {
      // Projects (M-09)
      const tasksList = await dbAll(`
        SELECT t.title, t.status, t.priority, e.name as assignee_name 
        FROM tasks t
        LEFT JOIN employees e ON t.assignee_id = e.id
        LIMIT 10
      `);

      contextData = `
### 📋 Kanban Project Tasks
| Task Title | Assignee | Status | Priority |
| :--- | :--- | :--- | :--- |
${tasksList.map(t => `| ${t.title} | ${t.assignee_name || 'Unassigned'} | ${t.status} | ${t.priority} |`).join('\n')}
      `.trim();
      isTable = true;
    } 
    else if (userQuery.includes('asset') || userQuery.includes('laptop') || userQuery.includes('hardware')) {
      // Assets (M-10)
      const assets = await dbAll(`
        SELECT a.name, a.asset_tag, a.status, e.name as assignee_name 
        FROM assets a
        LEFT JOIN employees e ON a.assigned_to = e.id
        LIMIT 10
      `);

      contextData = `
### 💻 Hardware Assets Inventory
| Device | Asset Tag | Status | Assignee |
| :--- | :--- | :--- | :--- |
${assets.map(a => `| ${a.name} | ${a.asset_tag} | ${a.status} | ${a.assignee_name || 'In Stock'} |`).join('\n')}
      `.trim();
      isTable = true;
    } 
    else if (userQuery.includes('ticket') || userQuery.includes('helpdesk') || userQuery.includes('support')) {
      // Help Desk (M-11)
      const tickets = await dbAll(`
        SELECT t.subject, t.category, t.priority, t.status, u.name as raised_by_name 
        FROM tickets t
        JOIN users u ON t.raised_by = u.id
        LIMIT 10
      `);

      contextData = `
### 🎫 Help Desk IT Queue
| Subject | Category | Priority | Reporter | Status |
| :--- | :--- | :--- | :--- | :--- |
${tickets.map(t => `| ${t.subject} | ${t.category} | ${t.priority} | ${t.raised_by_name} | ${t.status} |`).join('\n')}
      `.trim();
      isTable = true;
    }

    // 3. Synthesize final assistant response
    let assistantReply = '';
    if (contextData) {
      assistantReply = `
${contextualPrefix}### 🤖 AI Operations Assistant (Claude Proxy)

Based on a real-time scan of the database, here is the requested data table:

${contextData}
      `.trim();
    } else {
      assistantReply = `
${contextualPrefix}### 🤖 AI Operations Assistant (Claude Proxy)
Hello **${req.user.name}**! I am your AI Operations Assistant. I can scan your workspace SQLite database tables and perform visibility-checked RAG policies search.

Try querying:
* *"Search for employee policy documents"*
* *"Explain our payroll and salaries cost summary"*
* *"Who is currently on leave this week?"*
* *"Show our hardware asset inventory status"*
      `.trim();
    }

    // Save Assistant reply
    await dbRun('INSERT INTO ai_messages (conversation_id, role, content, structured_data) VALUES (?, "assistant", ?, ?)', [
      finalConvId, assistantReply, isTable ? JSON.stringify({ isTable: true }) : null
    ]);

    res.status(200).json({ response: assistantReply, conversationId: finalConvId });
  } catch (err) {
    res.status(500).json({ error: 'AI Operations Chatbot failed: ' + err.message });
  }
});

export default router;
