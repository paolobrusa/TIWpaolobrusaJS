package it.polimi.tiwpaolobrusajs.controllers.filterAndUtils;

import it.polimi.tiwpaolobrusajs.dao.ArticoloDAO;
import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.Serial;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

@WebServlet ("/AddArticolo")
public class AddArticolo extends HttpServlet {
    @Serial
    private static final long serialVersionUID = 1L;
    private Connection con = null;

    public AddArticolo() {
        super();
    }

    public void init() throws ServletException {
        ServletContext context = getServletContext();
        String user = context.getInitParameter("user");
        String pwd = context.getInitParameter("pwd");
        String driver = context.getInitParameter("driver");
        String url = context.getInitParameter("urlDb");
        try {
            Class.forName(driver);
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("Can't load driver");
        }
        try {
            con = DriverManager.getConnection(url, user, pwd);
        } catch (SQLException e) {
            throw new RuntimeException("Failed db connection");
        }
    }

    public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.sendRedirect(request.getContextPath() + "/Vendo");
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String n = request.getParameter("nome");
        String d = request.getParameter("descrizione");
        String o = request.getSession().getAttribute("user").toString();
        String path = request.getParameter("path");
        String p = request.getParameter("prezzo");
        if (n == null || d == null || o == null || path == null || p == null) {
            request.getSession().setAttribute("errorMessage", "Parametri non validi");
            response.sendRedirect(request.getContextPath() + "/Vendo");
            return;
        }
        ArticoloDAO aDAO = new ArticoloDAO(con);
        try {
            aDAO.addArticolo(n, d, o, path, Integer.parseInt(p));
        } catch (SQLException e) {
            request.getSession().setAttribute("errorMessage", e.getCause().getMessage());
            response.sendRedirect(request.getContextPath() + "/Vendo");
            return;
        }
        response.sendRedirect(request.getContextPath() + "/Vendo");
    }

    public void destroy() {
        if (con != null) {
            try {
                con.close();
            } catch (SQLException e) {
                throw new RuntimeException(e);
            }
        }
    }
}
