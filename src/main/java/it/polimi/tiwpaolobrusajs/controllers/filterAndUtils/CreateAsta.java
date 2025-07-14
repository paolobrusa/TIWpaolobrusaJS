package it.polimi.tiwpaolobrusajs.controllers.filterAndUtils;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import it.polimi.tiwpaolobrusajs.beans.Articolo;
import it.polimi.tiwpaolobrusajs.dao.ArticoloDAO;
import it.polimi.tiwpaolobrusajs.dao.AstaDAO;
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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/CreateAsta")
public class CreateAsta extends HttpServlet {
    @Serial
    private static final long serialVersionUID = 1L;
    private Connection con = null;

    public CreateAsta() {
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
        JsonObject jsonResponse = new JsonObject();
        jsonResponse.addProperty("success", false);
        jsonResponse.add("message", gson.toJsonTree("Get non supportato"));
        response.getWriter().write(gson.toJson(jsonResponse));
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        Gson gson = new Gson();
        String[] c = request.getParameterValues("codice");
        if(c == null || c.length == 0){
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree("Devi selezionare almeno 1 articolo"));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        List<Integer> cods = new ArrayList<>();
        int cod = 0;
        for (String s : c) {
            try{
                cod = Integer.parseInt(s);
            }
            catch(NumberFormatException e){
                JsonObject jsonResponse = new JsonObject();
                jsonResponse.addProperty("success", false);
                jsonResponse.add("message", gson.toJsonTree("Codici devono essere numeri"));
                response.getWriter().write(gson.toJson(jsonResponse));
                return;
            }
            cods.add(cod);
        }
        ArticoloDAO aDao = new ArticoloDAO(con);
        List<Articolo> articoli;
        try {
            articoli = aDao.getArticoli(cods);
        } catch (SQLException e) {
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree(e.getMessage()));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        AstaDAO aDao2 = new AstaDAO(con);
        int idAsta = 0;
        try {
            idAsta = aDao2.addAsta(articoli.stream().mapToInt(Articolo::getPrice).sum(), Integer.parseInt(request.getParameter("minBid")), LocalDateTime.parse(request.getParameter("date"), DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
        } catch (SQLException e) {
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree(e.getMessage()));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        String user = request.getSession().getAttribute("user").toString();
        try {
            aDao2.addArticoliAsta(idAsta, cods, user);
        } catch (SQLException e) {
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree(e.getMessage()));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        JsonObject jsonResponse = new JsonObject();
        jsonResponse.addProperty("success", true); //ricarica la pagina
        response.getWriter().write(gson.toJson(jsonResponse));
    }
}
