package it.polimi.tiwpaolobrusajs.controllers;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import it.polimi.tiwpaolobrusajs.beans.Articolo;
import it.polimi.tiwpaolobrusajs.beans.Asta;
import it.polimi.tiwpaolobrusajs.controllers.filterAndUtils.TimeLeft;
import it.polimi.tiwpaolobrusajs.dao.ArticoloDAO;
import it.polimi.tiwpaolobrusajs.dao.AstaDAO;
import jakarta.servlet.RequestDispatcher;
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
import java.util.List;

@WebServlet("/Vendo")
public class Vendo extends HttpServlet {
    @Serial
    private static final long serialVersionUID = 1L;
    private Connection con = null;

    public Vendo() {
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
        Gson gson = new Gson();
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
//        String errorMessage = (String) request.getSession().getAttribute("errorMessage");
//        if (errorMessage != null) {
//            request.getSession().removeAttribute("errorMessage");
//            request.setAttribute("errorMessage", errorMessage);
//        }
        AstaDAO aDAO = new AstaDAO(con);
        ArticoloDAO artDAO = new ArticoloDAO(con);
        List<Asta> aste;
        List<Articolo> articoli;
        try{
            aste = aDAO.getAste(request.getSession().getAttribute("user").toString());
            articoli = artDAO.getArticoli(request.getSession().getAttribute("user").toString());
            TimeLeft.timeLeft(aste);
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", true);
            jsonResponse.add("aste", gson.toJsonTree(aste));
            jsonResponse.add("articoli", gson.toJsonTree(articoli));
            response.getWriter().write(gson.toJson(jsonResponse));
        }
        catch (Exception e){
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree(e.getMessage()));
            response.getWriter().write(gson.toJson(jsonResponse));
        }
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        Gson gson = new Gson();
        JsonObject jsonResponse = new JsonObject();
        jsonResponse.addProperty("success", false);
        jsonResponse.add("message", gson.toJsonTree("Supportato solo il get!!"));
        response.getWriter().write(gson.toJson(jsonResponse));
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
