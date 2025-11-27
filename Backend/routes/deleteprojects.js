import express from "express";
import { docClient } from "../config/dynamodb.js";
import { DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const router = express.Router();

// render delete projects page
router.get("/deleteprojects", async (req, res) => {
    try {

        // redirect non-admins back to their projects
        if (req.session.is_admin !== true) {
            return res.redirect("/Yourprojects");
        }

        const result = await docClient.send(
            new ScanCommand({
                TableName: process.env.PROJECTS_TABLE,
            })
        );

        const projects = result.Items || [];

        res.render("deleteprojects", {
            projects: projects.map(p => ({
                project_id: p.project_id,
                project_name: p.project_name
            }))
        });

    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).send("Error loading projects");
    }
});

// delete a specific project
router.delete("/projects/:project_id/delete", async (req, res) => {
    const project_id = Number(req.params.project_id);

    try {
        await docClient.send(
            new DeleteCommand({
                TableName: process.env.PROJECTS_TABLE,
                Key: { project_id: project_id },
            })
        );

        res.json({ success: true, message: "Project deleted successfully" });

    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete project"
        });
    }
});

export default router;