package it.polimi.tiwpaolobrusajs.controllers;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import it.polimi.tiwpaolobrusajs.beans.Asta;
import it.polimi.tiwpaolobrusajs.beans.Offerta;
import it.polimi.tiwpaolobrusajs.controllers.filterAndUtils.TimeLeft;
import it.polimi.tiwpaolobrusajs.dao.AstaDAO;
import it.polimi.tiwpaolobrusajs.dao.OffertaDAO;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.Serial;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/Acquisto")
public class Acquisto extends HttpServlet {
    @Serial
    private static final long serialVersionUID = 1L;
    private Connection con;

    public Acquisto() {
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
        Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd HH:mm:ss").create();
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        OffertaDAO oDao = new OffertaDAO(con);
        List<Offerta> aggiud;
        try {
            aggiud = oDao.getOfferteAggiudicate(request.getSession().getAttribute("user").toString());
        } catch (SQLException e) {
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("error", gson.toJsonTree(e.getMessage()));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        List<Asta> aste = new ArrayList<>();
        AstaDAO aDao = new AstaDAO(con);
        String keyWord = request.getParameter("search");
        String errorMessage = null;
        if (keyWord != null) {
            keyWord = keyWord.replace("\\", "\\\\")
                    .replace("%", "\\%")
                    .replace("_", "\\_");
            try {
                aste = aDao.getAstaByKeyword(keyWord, request.getSession().getAttribute("user").toString());
                TimeLeft.timeLeft(aste);
            } catch (SQLException e) {
                JsonObject jsonResponse = new JsonObject();
                jsonResponse.addProperty("success", false);
                jsonResponse.add("error", gson.toJsonTree(e.getMessage()));
                response.getWriter().write(gson.toJson(jsonResponse));
                return;
            }
            if (aste.isEmpty()) {
                errorMessage = "Non trovato";
            }
        }
        JsonObject jsonResponse = new JsonObject();
        jsonResponse.add("aste", gson.toJsonTree(aste));
        jsonResponse.add("aggiudicazioni", gson.toJsonTree(aggiud));
        jsonResponse.addProperty("success", true);
        if (errorMessage != null) {
            jsonResponse.addProperty("error", errorMessage);
        }
        response.getWriter().write(gson.toJson(jsonResponse));
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        Gson gson = new Gson();
        JsonObject jsonResponse = new JsonObject();
        jsonResponse.addProperty("success", false);
        jsonResponse.add("error", gson.toJsonTree("Supportato solo il get!!"));
        response.getWriter().write(gson.toJson(jsonResponse));
    }
}
