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
    let navigationTab = null;

    // Check for navigation commands
    const navQuery = userQuery.replace(/[^a-z0-9\s]/g, '').trim();
    const isNavCommand = navQuery.includes('open') || 
                         navQuery.includes('go to') || 
                         navQuery.includes('navigate') || 
                         navQuery.includes('show tab') ||
                         navQuery.includes('switch to') ||
                         navQuery.includes('take me to') ||
                         navQuery.includes('inspect tab') ||
                         navQuery === 'attendance clock' ||
                         navQuery === 'attendance' ||
                         navQuery === 'workforce insights' ||
                         navQuery === 'insights' ||
                         navQuery === 'employees directory' ||
                         navQuery === 'directory' ||
                         navQuery === 'organization management' ||
                         navQuery === 'organizations' ||
                         navQuery === 'audit log compliance' ||
                         navQuery === 'audit logs' ||
                         navQuery === 'recruitment board' ||
                         navQuery === 'recruitment' ||
                         navQuery === 'leave management' ||
                         navQuery === 'leave' ||
                         navQuery === 'payroll remuneration' ||
                         navQuery === 'payroll' ||
                         navQuery === 'performance targets' ||
                         navQuery === 'performance' ||
                         navQuery === 'project tasks' ||
                         navQuery === 'projects' ||
                         navQuery === 'asset inventory' ||
                         navQuery === 'assets' ||
                         navQuery === 'help desk tickets' ||
                         navQuery === 'tickets';
                         
    if (isNavCommand) {
      if (navQuery.includes('attendance') || navQuery.includes('clock') || navQuery.includes('checkin') || navQuery.includes('timecard')) {
        navigationTab = 'attendance';
      } else if (navQuery.includes('payroll') || navQuery.includes('salary') || navQuery.includes('salaries') || navQuery.includes('payslip')) {
        navigationTab = 'payroll';
      } else if (navQuery.includes('recruitment') || navQuery.includes('candidate') || navQuery.includes('interview') || navQuery.includes('offer')) {
        navigationTab = 'recruitment';
      } else if (navQuery.includes('project') || navQuery.includes('task') || navQuery.includes('kanban') || navQuery.includes('todo')) {
        navigationTab = 'projects';
      } else if (navQuery.includes('asset') || navQuery.includes('hardware') || navQuery.includes('laptop') || navQuery.includes('inventory')) {
        navigationTab = 'assets';
      } else if (navQuery.includes('audit') || navQuery.includes('compliance') || navQuery.includes('log') || navQuery.includes('event')) {
        navigationTab = 'auditLogs';
      } else if (navQuery.includes('employee') || navQuery.includes('directory') || navQuery.includes('people') || navQuery.includes('staff')) {
        navigationTab = 'employees';
      } else if (navQuery.includes('organization') || navQuery.includes('department') || navQuery.includes('dept') || navQuery.includes('tree')) {
        navigationTab = 'organizations';
      } else if (navQuery.includes('leave') || navQuery.includes('vacation') || navQuery.includes('holiday') || navQuery.includes('pto')) {
        navigationTab = 'leave';
      } else if (navQuery.includes('overview') || navQuery.includes('dashboard') || navQuery.includes('home')) {
        navigationTab = 'overview';
      } else if (navQuery.includes('insight') || navQuery.includes('analytic') || navQuery.includes('chart') || navQuery.includes('graph') || navQuery.includes('metric')) {
        navigationTab = 'insights';
      } else if (navQuery.includes('performance') || navQuery.includes('target') || navQuery.includes('goal') || navQuery.includes('review') || navQuery.includes('kpi')) {
        navigationTab = 'performance';
      } else if (navQuery.includes('ticket') || navQuery.includes('support') || navQuery.includes('helpdesk') || navQuery.includes('help desk')) {
        navigationTab = 'tickets';
      } else {
        const dbDepts = await dbAll("SELECT name FROM organizations");
        const matchesDept = dbDepts.some(d => navQuery.includes(d.name.toLowerCase()));
        if (matchesDept) {
          navigationTab = 'organizations';
        }
      }
    }

    // Persist or retrieve conversation session
    if (!finalConvId) {
      const title = query.substring(0, 30) + '...';
      const convResult = await dbRun('INSERT INTO ai_conversations (user_id, title) VALUES (?, ?)', [req.user.id, title]);
      finalConvId = convResult.id;
    }

    // Save User message
    await dbRun('INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, "user", ?)', [finalConvId, query]);

    // 2. Intent parsing & dynamic database search tools
    const matchKeywords = (query, keywordsArray) => {
      return keywordsArray.some(keyword => query.includes(keyword));
    };

    // Synonym categories
    const docKeywords = ['policy', 'document', 'rag', 'rule', 'handbook', 'guideline', 'manual', 'file', 'pdf', 'docs', 'procedure', 'regulation', 'contract', 'agreement', 'terms'];
    const payrollKeywords = ['salary', 'payroll', 'payslip', 'pay', 'earn', 'money', 'cost', 'spend', 'financial', 'remuneration', 'compensation', 'income', 'wage', 'check', 'tax', 'deduction', 'slip', 'cash'];
    const attendanceKeywords = ['attendance', 'clock', 'timecard', 'present', 'absent', 'hours', 'log', 'checkin', 'checkout', 'late', 'worktime', 'timesheet', 'history', 'timed'];
    const leaveKeywords = ['leave', 'vacation', 'off', 'out of office', 'sick', 'break', 'absence', 'ooo', 'time off', 'time-off', 'pto', 'furlough'];
    const taskKeywords = ['project', 'task', 'kanban', 'todo', 'assignee', 'doing', 'backlog', 'board', 'work item', 'milestone', 'progress', 'develop', 'coding', 'issue', 'workload'];
    const assetKeywords = ['asset', 'laptop', 'hardware', 'device', 'computer', 'monitor', 'inventory', 'stock', 'equipment', 'item', 'macbook', 'pc', 'mouse', 'keyboard'];
    const ticketKeywords = ['ticket', 'helpdesk', 'support', 'issue', 'bug', 'error', 'broken', 'help', 'request', 'it support', 'service desk', 'complaint', 'problem'];
    const employeeKeywords = ['employ', 'user', 'member', 'staff', 'people', 'who is', 'find person', 'directory', 'contact', 'who works', 'names', 'colleague', 'team', 'worker', 'profiles'];
    const departmentKeywords = ['department', 'organization', 'division', 'dept', 'office', 'branch', 'structure', 'tree', 'corporate'];
    const shiftKeywords = ['shift', 'schedule', 'timetable', 'timing', 'hours', 'clock-in', 'rota'];
    const holidayKeywords = ['holiday', 'festive', 'calendar', 'vacation day', 'off day', 'celebration'];
    const greetings = ['hello', 'hi', 'hey', 'greetings', 'yo', 'sup', 'morning', 'afternoon'];
    const capabilityKeywords = ['what can you do', 'help', 'features', 'capabilities', 'how to use', 'guide', 'instructions', 'help me'];

    // 2. Intent parsing & dynamic database search tools
    if (matchKeywords(userQuery, docKeywords)) {
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
    else if (matchKeywords(userQuery, payrollKeywords)) {
      // Payroll Explainer (M-07) - RBAC checked
      let payrollData = [];
      if (req.user.role === 'Admin' || req.user.role === 'Super Admin' || req.user.role === 'HR') {
        payrollData = await dbAll(`
          SELECT p.*, u.name as employee_name 
          FROM payrolls p
          JOIN employees e ON p.employee_id = e.id
          JOIN users u ON e.user_id = u.id
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
    else if (matchKeywords(userQuery, attendanceKeywords)) {
      // Attendance (M-05) summary
      const attendance = await dbAll(`
        SELECT a.date, a.status, u.name as employee_name 
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        JOIN users u ON e.user_id = u.id
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
    else if (matchKeywords(userQuery, leaveKeywords)) {
      // Leave Assistant (M-06)
      const leaves = await dbAll(`
        SELECT lr.*, u.name as employee_name 
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
        JOIN users u ON e.user_id = u.id
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
    else if (matchKeywords(userQuery, taskKeywords)) {
      // Projects (M-09)
      const tasksList = await dbAll(`
        SELECT t.title, t.status, t.priority, u.name as assignee_name 
        FROM tasks t
        LEFT JOIN employees e ON t.assignee_id = e.id
        LEFT JOIN users u ON e.user_id = u.id
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
    else if (matchKeywords(userQuery, assetKeywords)) {
      // Assets (M-10)
      const assets = await dbAll(`
        SELECT a.name, a.asset_tag, a.status, u.name as assignee_name 
        FROM assets a
        LEFT JOIN employees e ON a.assigned_to = e.id
        LEFT JOIN users u ON e.user_id = u.id
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
    else if (matchKeywords(userQuery, ticketKeywords)) {
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
    else if (matchKeywords(userQuery, employeeKeywords)) {
      // Check if they are asking for a count/total of employees
      const isCountQuery = userQuery.includes('how many') || userQuery.includes('count') || userQuery.includes('total') || userQuery.includes('number of');
      
      if (isCountQuery) {
        const activeCount = await dbGet("SELECT COUNT(*) as count FROM employees WHERE status = 'Active'");
        const totalCount = await dbGet("SELECT COUNT(*) as count FROM employees");
        
        contextData = `
### 👤 Employee Count Summary
Syncra Enterprise currently has **${activeCount.count}** active employees (**${totalCount.count}** total registered profiles).
        `.trim();
        isTable = false;
      } else {
        // Search for specific employee
        const stopWords = new Set(['who', 'is', 'find', 'search', 'for', 'employee', 'employees', 'employ', 'staff', 'member', 'the', 'a', 'an', 'show', 'list', 'details', 'colleague', 'user', 'people']);
        const queryWords = userQuery.split(/\s+/).filter(w => !stopWords.has(w) && w.length > 2);
        
        let employees = [];
        if (queryWords.length > 0) {
          const placeholders = queryWords.map(() => 'u.name LIKE ?').join(' OR ');
          const params = queryWords.map(w => `%${w}%`);
          employees = await dbAll(`
            SELECT u.name, u.email, e.status, u.role, o.name as department_name 
            FROM employees e
            JOIN users u ON e.user_id = u.id
            LEFT JOIN organizations o ON e.department_id = o.id
            WHERE ${placeholders}
            LIMIT 10
          `, params);
        } else {
          employees = await dbAll(`
            SELECT u.name, u.email, e.status, u.role, o.name as department_name 
            FROM employees e
            JOIN users u ON e.user_id = u.id
            LEFT JOIN organizations o ON e.department_id = o.id
            LIMIT 10
          `);
        }

        contextData = `
### 👤 Corporate Directory Search
| Name | Email | Department | Role | Status |
| :--- | :--- | :--- | :--- | :--- |
${employees.map(e => `| ${e.name} | ${e.email} | ${e.department_name || 'N/A'} | ${e.role} | ${e.status} |`).join('\n')}
        `.trim();
        isTable = true;
      }
    }
    else if (matchKeywords(userQuery, departmentKeywords)) {
      const depts = await dbAll(`
        SELECT name, code, status 
        FROM organizations 
        LIMIT 20
      `);
      contextData = `
### 🏢 Corporate Departments Registry
There are **${depts.length}** total departments/nodes configured in the system:

| Department Name | Code / Identifier | Status |
| :--- | :--- | :--- |
${depts.map(d => `| ${d.name} | ${d.code || 'N/A'} | ${d.status} |`).join('\n')}
      `.trim();
      isTable = true;
    }
    else if (matchKeywords(userQuery, shiftKeywords)) {
      const shifts = await dbAll(`
        SELECT name, start_time, end_time, status 
        FROM work_shifts 
        LIMIT 10
      `);
      contextData = `
### ⏰ Corporate Work Shifts
Here is the work shift schedule configuration:

| Shift Name | Start Time | End Time | Status |
| :--- | :--- | :--- | :--- |
${shifts.map(s => `| ${s.name} | ${s.start_time} | ${s.end_time} | ${s.status} |`).join('\n')}
      `.trim();
      isTable = true;
    }
    else if (matchKeywords(userQuery, holidayKeywords)) {
      const holidays = await dbAll(`
        SELECT name, date, description 
        FROM holidays 
        ORDER BY date ASC 
        LIMIT 10
      `);
      contextData = `
### 🏖️ Corporate Holiday Calendar
Here are the official public and company holidays:

| Holiday | Date | Description |
| :--- | :--- | :--- |
${holidays.map(h => `| ${h.name} | ${h.date} | ${h.description || 'Company Holiday'} |`).join('\n')}
      `.trim();
      isTable = true;
    }

    // 3. Synthesize final assistant response
    let assistantReply = '';
    if (navigationTab) {
      const tabNames = {
        attendance: '⏱️ Attendance Tracking',
        payroll: '💵 Payroll Explainer',
        recruitment: '🤝 Recruitment Pipeline',
        projects: '📋 Project Kanban Board',
        assets: '💻 Hardware Asset Registry',
        auditLogs: '🛡️ System Audit Logs',
        employees: '👤 Employee Directory',
        organizations: '🏢 Enterprise Department Tree',
        leave: '📅 Leave Planner',
        overview: '📊 Command Center Overview',
        insights: '📈 Workforce Insights',
        performance: '🎯 Performance Targets',
        tickets: '🎫 IT Help Desk'
      };
      
      assistantReply = `
### 🤖 Rachel

I am opening the **${tabNames[navigationTab]}** section for you right now!

${contextData ? `Here is the data summary for this section:\n\n${contextData}` : ''}
      `.trim();
    } else if (contextData) {
      assistantReply = `
### 🤖 Rachel

Based on a real-time scan of the database, here is the requested data table:

${contextData}
      `.trim();
    } else if (matchKeywords(userQuery, greetings) || userQuery.includes('morning') || userQuery.includes('afternoon') || userQuery.includes('evening') || userQuery.includes('night')) {
      let greetingText = '';
      if (userQuery.includes('morning')) {
        greetingText = `Good morning, **${req.user.name}**! ☀️ How can I assist you with Syncra Enterprise operations this morning? You can ask me to search policy manuals, check shift timetables, or audit log check-ins!`;
      } else if (userQuery.includes('afternoon')) {
        greetingText = `Good afternoon, **${req.user.name}**! 🌤️ Hope your day is going well. What SQLite database records or documents can I fetch for you this afternoon?`;
      } else if (userQuery.includes('evening')) {
        greetingText = `Good evening, **${req.user.name}**! 🌇 As the day winds down, let me know if you need to review any project tasks, leave schedules, or active IT tickets tonight.`;
      } else if (userQuery.includes('night')) {
        greetingText = `Good night, **${req.user.name}**! 🌙 Hope you had a productive day. Let me know if there's any final detail you need to check before logging off.`;
      } else {
        const greetingOptions = [
          `Hello **${req.user.name}**! 😊 How can I help you manage Syncra Enterprise today? You can ask me about payroll logs, employee directory details, shift schedules, hardware assets, or company policy documents.`,
          `Hi **${req.user.name}**! 👋 Rachel active. What information from our SQLite database can I retrieve for you?`,
          `Greetings, **${req.user.name}**! 🤖 I'm connected to the workspace system. Ask me anything about tasks, team leaves, or IT support tickets!`
        ];
        greetingText = greetingOptions[Math.floor(Math.random() * greetingOptions.length)];
      }
      assistantReply = `### 🤖 Rachel\n\n` + greetingText;
    } else if (matchKeywords(userQuery, capabilityKeywords)) {
      assistantReply = `
### 🤖 Rachel

I am your intelligent assistant. I can query our SQLite database dynamically to help you inspect:
1. 📁 **Policy Documents (RAG)**: Search and view employee guidelines.
2. 💵 **Payroll Explainer**: View salaries, deductions, and payslip data (RBAC enforced).
3. ⏱️ **Attendance Logs**: Track employee check-in history.
4. 📅 **Leave Requests**: Check who is out of office.
5. 📋 **Project Tasks**: Monitor Kanban progress.
6. 💻 **Hardware Inventory**: Check devices and laptop allocations.
7. 🎫 **IT Help Desk**: Review support ticket queues.
8. 👤 **Employee Directory**: Search colleagues by name (e.g., query *"Who is Priya?"*).
      `.trim();
    } else {
      assistantReply = `
### 🤖 Rachel

I analyzed your query: *"**${query}**"*. 

While I couldn't map that directly to a specific database command, I can assist you with:
* 👤 **Finding colleagues** (e.g., *"Search for Rahul"* or *"Who is Priya?"*)
* 💵 **Payroll details** (e.g., *"Show basic salary logs"* or *"payroll costs"*)
* 📅 **Leave tracker** (e.g., *"Is anyone on vacation?"*)
* ⏱️ **Work time logs** (e.g., *"Attendance check-ins"* or *"clock status"*)
* 📁 **Company rules** (e.g., *"Search HR policy manual"*)

Let me know what you would like to look up!
      `.trim();
    }

    // Save Assistant reply
    await dbRun('INSERT INTO ai_messages (conversation_id, role, content, structured_data) VALUES (?, "assistant", ?, ?)', [
      finalConvId, assistantReply, isTable ? JSON.stringify({ isTable: true }) : null
    ]);

    res.status(200).json({ response: assistantReply, conversationId: finalConvId, navigationTab });
  } catch (err) {
    res.status(500).json({ error: 'AI Operations Chatbot failed: ' + err.message });
  }
});

export default router;
