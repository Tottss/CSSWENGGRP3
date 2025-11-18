export const showAdminView = async (req, res) => {
  res.render("adminView", {
    title: "Admin View",
  });
};

export const showAdminDashboard = async (req, res) => {
  res.render("admindashboard", {
    title: "Admin Dashboard",
    PartnerOrg: req.session.user_name || "Partner Org Name",
    Proposals: [
      {
        Submission: true,
        ProjectName: "Project Name",
        Date: "2024-06-01",
        PartnerOrg: "EXAMPLE ORG",
        href: "/linktoProp",
      },
      {
        Update: true,
        ProjectName: "Example Project2",
        Date: "2024-08-21",
        PartnerOrg: "EORG",
      },
      {
        Submission: true,
        ProjectName: "Example Project3",
        Date: "2024-11-21",
        PartnerOrg: "AORG",
      },
      {
        Submission: true,
        ProjectName: "Example Project3",
        Date: "2024-11-21",
        PartnerOrg: "AORG",
      },
      {
        Submission: true,
        ProjectName: "Example Project3",
        Date: "2024-11-21",
        PartnerOrg: "AORG",
      },
      {
        Submission: true,
        ProjectName: "Example Project3",
        Date: "2024-11-21",
        PartnerOrg: "AORG",
      },
      {
        Submission: true,
        ProjectName: "Example Project3",
        Date: "2024-11-21",
        PartnerOrg: "AORG",
      },
    ],
  });
};
