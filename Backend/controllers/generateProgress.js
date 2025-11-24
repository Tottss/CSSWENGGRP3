import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../config/dynamodb.js";

export const showGenProg = async (req, res) => {
  res.render("generateProgress", {
    projects: [
      {
        project_id: 1,
        project_name: "Community Garden Project",
      },
      {
        project_id: 2,
        project_name: "Beach Cleanup Initiative",
      },
      {
        project_id: 3,
        project_name: "Tree Planting Program",
      },
    ],
  });
};
