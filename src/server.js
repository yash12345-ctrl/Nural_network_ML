// src/server.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const path = require('path');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// --- 1. STUDENT LOGIN ROUTE (Saves to 'Student' Table) ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { name, regNo, email } = req.body;

        // Upsert: Create if new, Update timestamp if exists
        const student = await prisma.student.upsert({
            where: { regNo: regNo },
            update: { lastLogin: new Date() },
            create: {
                name,
                regNo,
                email,
                lastLogin: new Date()
            }
        });

        console.log(`[LOGIN] ${name} (${regNo})`);
        res.json({ success: true, student });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// --- 2. EXPERIMENT SUBMISSION ROUTE (Saves to 'ExperimentLog' Table) ---
app.post('/api/experiment/save', async (req, res) => {
    try {
        const { studentName, regNo, experiment, timeTaken, tabSwitches, screenShots, status } = req.body;

        const log = await prisma.experimentLog.create({
            data: {
                studentName,
                regNo,
                experiment: experiment || "Unknown Exp",
                timeTaken,
                tabSwitches: parseInt(tabSwitches),
                screenShots: parseInt(screenShots),
                status
            }
        });

        console.log(`[EXP LOG] ${experiment} - ${studentName}: ${status}`);
        res.json({ success: true, id: log.id });
    } catch (error) {
        console.error("Experiment Save Error:", error);
        res.status(500).json({ error: "Failed to save experiment" });
    }
});

// --- 3. GET EXPERIMENT LOGS (For Admin Dashboard) ---
app.get('/api/admin/logs', async (req, res) => {
    try {
        const logs = await prisma.experimentLog.findMany({
            orderBy: { submittedAt: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: "Fetch error" });
    }
});

// --- 4. GET STUDENTS DIRECTORY (For Students Page) ---
// --- 4. GET STUDENTS DIRECTORY (FIXED FOR FRONTEND) ---
app.get('/api/admin/students', async (req, res) => {
    try {
        // 1. Fetch all students
        const students = await prisma.student.findMany({
            orderBy: { lastLogin: 'desc' }
        });

        // 2. Fetch experiment counts for each student (Parallel calculation)
        // We map over the students and add the missing fields
        const formattedStudents = await Promise.all(students.map(async (student) => {
            const labCount = await prisma.experimentLog.count({
                where: { regNo: student.regNo }
            });

            return {
                name: student.name,
                regNo: student.regNo,
                email: student.email,
                // MAP BACKEND TO FRONTEND NAMES:
                lastActive: student.lastLogin, // Frontend expects 'lastActive'
                totalLabs: labCount            // Frontend expects 'totalLabs'
            };
        }));

        res.json(formattedStudents);
    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ error: "Fetch error" });
    }
});

// --- 5. GET STATS (For KPI Cards) ---
app.get('/api/admin/stats', async (req, res) => {
    try {
        const [totalLogs, terminated, completed, studentCount] = await Promise.all([
            prisma.experimentLog.count(),
            prisma.experimentLog.count({ where: { status: 'TERMINATED' } }),
            prisma.experimentLog.count({ where: { status: 'COMPLETED' } }),
            prisma.student.count()
        ]);

        res.json({
            totalLogs,
            terminated,
            completed,
            activeStudents: studentCount
        });
    } catch (error) {
        res.status(500).json({ error: "Stats error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});