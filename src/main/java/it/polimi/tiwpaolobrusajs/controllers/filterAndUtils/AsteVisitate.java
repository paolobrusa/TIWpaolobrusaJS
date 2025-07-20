package it.polimi.tiwpaolobrusajs.controllers.filterAndUtils;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import it.polimi.tiwpaolobrusajs.beans.Asta;
import it.polimi.tiwpaolobrusajs.dao.AstaDAO;
import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/AsteVisitate")
public class AsteVisitate extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private Connection con;

    public AsteVisitate() {
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

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        Gson gson = new Gson();
        String user = request.getSession().getAttribute("user").toString();
        if(user == null) {
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Utente non autenticato");
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        JsonObject jsonResponse = new JsonObject();
        try {
            String[] ids = request.getParameterValues("ids");

            if (ids == null || ids.length == 0) {
                jsonResponse.addProperty("success", false);
                jsonResponse.addProperty("message", "Nessun ID asta fornito");
                response.getWriter().write(gson.toJson(jsonResponse));
                return;
            }

            List<Integer> asteIds = new ArrayList<>();
            for (String id : ids) {
                try {
                    asteIds.add(Integer.parseInt(id));
                } catch (NumberFormatException e) {
                    jsonResponse.addProperty("success", false);
                    jsonResponse.addProperty("message", "Un id non è valido");
                    response.getWriter().write(gson.toJson(jsonResponse));
                    return;
                }
            }
            AstaDAO astaDAO = new AstaDAO(con);
            List<Asta> aste = astaDAO.getAsteByIds(asteIds);
            TimeLeft.timeLeft(aste);
            jsonResponse.addProperty("success", true);
            jsonResponse.add("aste", gson.toJsonTree(aste));
            if (aste.isEmpty()) {
                jsonResponse.addProperty("message", "Le aste visitate sono terminate");
            }
        } catch (Exception e) {
            e.printStackTrace();
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Errore del server: " + e.getMessage());
        }
        response.getWriter().write(gson.toJson(jsonResponse));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        doGet(request,response);
    }
}
