package it.polimi.tiwpaolobrusajs.controllers;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import it.polimi.tiwpaolobrusajs.beans.Articolo;
import it.polimi.tiwpaolobrusajs.beans.Offerta;
import it.polimi.tiwpaolobrusajs.beans.State;
import it.polimi.tiwpaolobrusajs.dao.ArticoloDAO;
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
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Comparator;
import java.util.List;

@WebServlet("/Offerta")
public class Offerte extends HttpServlet {
    @Serial
    private static final long serialVersionUID = 1L;
    private Connection con;
    RequestDispatcher dispatcher = null;

    public Offerte() {
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
//        String errorMessage = (String) request.getSession().getAttribute("errorMessage");
//        if (errorMessage != null) {
//            request.getSession().removeAttribute("errorMessage");
//            request.setAttribute("errorMessage", errorMessage);
//        }
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
        AstaDAO astaDAO = new AstaDAO(con);
        ArticoloDAO articoloDAO = new ArticoloDAO(con);
        OffertaDAO offertaDAO = new OffertaDAO(con);
        List<Articolo> articoli;
        List<Offerta> offerta;
        State s = null;
        String user = request.getSession().getAttribute("user").toString();
        try {
            s = astaDAO.getState(idasta, user);
            articoli = articoloDAO.getArticoliByAsta(idasta);
            offerta = offertaDAO.getOfferta(idasta);
        } catch (SQLException e) {
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree(e.getMessage()));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        if(articoli.isEmpty()){
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree("Errore caricamento articoli, assicurati di aver selezionato un asta"));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        if(s == null){
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree("Asta tua o non esistente"));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        if(s == State.chiusa){
            Offerta winner = null;
            winner = offerta.stream().max(Comparator.comparing(Offerta::getBid)).orElse(null);
            if(winner == null || !winner.getUsnUser().equals(user)){
                JsonObject jsonResponse = new JsonObject();
                jsonResponse.addProperty("success", false);
                jsonResponse.add("message", gson.toJsonTree("Asta chiusa non aggiudicata a te!"));
                response.getWriter().write(gson.toJson(jsonResponse));
                return;
            }
        }
        JsonObject jsonResponse = new JsonObject();
        jsonResponse.addProperty("success", true);
        jsonResponse.add("articoli", gson.toJsonTree(articoli));
        jsonResponse.add("offerta", gson.toJsonTree(offerta));
        response.getWriter().write(gson.toJson(jsonResponse));
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd HH:mm:ss").create();
        String id = request.getParameter("idasta");
        String offerta = request.getParameter("offertaprezzo");
        if (id == null || offerta == null || offerta.length() > 11) {
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree("Un parametro è null, non è accettato"));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        int idasta = 0, offertaprezzo = 0;
        try{
            idasta = Integer.parseInt(id);
            offertaprezzo = Integer.parseInt(offerta);
        }
        catch(NumberFormatException e){
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree("Formato numerico non valido"));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        if(offertaprezzo <= 0){
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree("L'offerta deve essere positiva"));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        OffertaDAO oDao = new OffertaDAO(con);
        try {
            oDao.insertOfferta(request.getSession().getAttribute("user").toString(), offertaprezzo, idasta);
        } catch (SQLException e) {
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree(e.getMessage()));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        JsonObject jsonResponse = new JsonObject();
        jsonResponse.addProperty("success", true);
        response.getWriter().write(gson.toJson(jsonResponse)); //Ricarica la pagina con la nuova offerta (chiamata ajax)
    }
}
