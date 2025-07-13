package it.polimi.tiwpaolobrusajs.controllers;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import it.polimi.tiwpaolobrusajs.beans.*;
import it.polimi.tiwpaolobrusajs.dao.ArticoloDAO;
import it.polimi.tiwpaolobrusajs.dao.AstaDAO;
import it.polimi.tiwpaolobrusajs.dao.OffertaDAO;
import it.polimi.tiwpaolobrusajs.dao.UtenteDAO;
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
import java.util.Comparator;
import java.util.List;

@WebServlet("/Dettaglio")
public class DettaglioAsta extends HttpServlet {
    @Serial
    private static final long serialVersionUID = 1L;
    private Connection con = null;
    RequestDispatcher dispatcher = null;

    public DettaglioAsta() {
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
        String id = request.getParameter("idasta");
        if (id == null) {
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree("Errore imprevisto, assicurati di aver selezionato un asta"));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        int idasta = 0;
        try{
            idasta = Integer.parseInt(id);
        }
        catch(NumberFormatException e){
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree(e.getMessage()));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        AstaDAO aDao = new AstaDAO(con);
        OffertaDAO oDao = new OffertaDAO(con);
        ArticoloDAO arDao = new ArticoloDAO(con);
        Asta asta;
        List<Offerta> o;
        List<Articolo> a;
        try {
            asta = aDao.getAsta(idasta, request.getSession().getAttribute("user").toString());
            o = oDao.getOfferta(idasta);
            a = arDao.getArticoliByAsta(idasta);
        } catch (SQLException e) {
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree(e.getMessage()));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        if(asta != null && asta.getState() == State.attiva){
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", true);
            jsonResponse.add("asta", gson.toJsonTree(asta));
            jsonResponse.add("offerte", gson.toJsonTree(o));
            jsonResponse.add("articoli", gson.toJsonTree(a));
            response.getWriter().write(gson.toJson(jsonResponse));
        }
        else if(asta != null && asta.getState() == State.chiusa){
            UtenteDAO uDao = new UtenteDAO(con);
            Offerta winner = null;
            winner = o.stream().max(Comparator.comparing(Offerta::getBid)).orElse(null);
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", true);
            jsonResponse.add("asta", gson.toJsonTree(asta));
            jsonResponse.add("offerte", gson.toJsonTree(o));
            jsonResponse.add("articoli", gson.toJsonTree(a));
            Utente u = null;
            if (winner != null) {
                try {
                    u = uDao.getWinner(winner.getUsnUser());
                } catch (SQLException e) {
                    jsonResponse.addProperty("success", false);
                    jsonResponse.add("message", gson.toJsonTree("Non c'è l'aggiudicatario"));
                    response.getWriter().write(gson.toJson(jsonResponse));
                    return;
                }
                jsonResponse.add("utente", gson.toJsonTree(u));
            }
            jsonResponse.add("offertaVincente", gson.toJsonTree(winner));
            response.getWriter().write(gson.toJson(jsonResponse));
        }
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        Gson gson = new Gson();
        String idAsta = request.getParameter("idAsta");
        int idasta = 0;
        if (idAsta == null) return;
        try {
            idasta = Integer.parseInt(idAsta);
        }
        catch(NumberFormatException e){
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree("Formato id non valido"));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        String user = request.getSession().getAttribute("user").toString();
        AstaDAO astaDAO = new AstaDAO(con);
        try {
            astaDAO.closeState(idasta, user);
        } catch (SQLException e) {
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree(e.getMessage()));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        JsonObject jsonResponse = new JsonObject();
        jsonResponse.addProperty("success", true);//qua bisogna riaggiornare la pagina js
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
