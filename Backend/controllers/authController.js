// controllers/authController.js
export const showLogin = async (req, res) => {
  req.session.visited = true;

  // Debug logs (remove in production)
  console.log(req.session);
  console.log(req.sessionID);

  res.render("login", {
    title: "Login Page",
    layout: false,
  });
};

export const logoutUser = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.redirect("/login");
    }

    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
};
