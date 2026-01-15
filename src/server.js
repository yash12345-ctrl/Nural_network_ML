// src/server.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const path = require('path');

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// --- API ROUTES ---

// 1. SAVE LOG (From Student)
app.post('/api/save-log', async (req, res) => {
    try {
        const newLog = await prisma.studentLog.create({
            data: req.body
        });
        res.status(200).json({ success: true, id: newLog.id });
    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ success: false });
    }
});

// 2. GET ALL LOGS (For Admin)
app.get('/api/admin/logs', async (req, res) => {
    try {
        const logs = await prisma.studentLog.findMany({
            orderBy: { submittedAt: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: "Fetch Error" });
    }
});

// 3. DELETE LOG (Admin Power)
app.delete('/api/admin/logs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.studentLog.delete({
            where: { id: parseInt(id) }
        });
        res.json({ success: true });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false });
    }
});

// 4. GET SYSTEM STATS (For Admin Dashboard Cards)
app.get('/api/admin/stats', async (req, res) => {
    try {
        const total = await prisma.studentLog.count();
        const terminated = await prisma.studentLog.count({ where: { status: 'TERMINATED' } });
        const completed = await prisma.studentLog.count({ where: { status: 'COMPLETED' } });
        
        // Calculate average tab switches
        const aggregations = await prisma.studentLog.aggregate({
            _sum: { tabSwitches: true, screenShots: true },
            _avg: { tabSwitches: true }
        });

        res.json({
            total,
            terminated,
            completed,
            totalViolations: (aggregations._sum.tabSwitches || 0) + (aggregations._sum.screenShots || 0),
            avgViolations: aggregations._avg.tabSwitches || 0
        });
    } catch (error) {
        res.status(500).json({ error: "Stats Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});