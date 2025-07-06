package it.polimi.tiwpaolobrusajs.controllers;

import it.polimi.tiwpaolobrusajs.beans.Articolo;
import it.polimi.tiwpaolobrusajs.beans.Offerta;
import it.polimi.tiwpaolobrusajs.dao.ArticoloDAO;
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
        String errorMessage = (String) request.getSession().getAttribute("errorMessage");
        if (errorMessage != null) {
            request.getSession().removeAttribute("errorMessage");
            request.setAttribute("errorMessage", errorMessage);
        }
        String id = request.getParameter("idasta");
        if (id == null) {
            request.setAttribute("errorMessage", "Errore imprevisto, assicurati di aver selezionato un asta");
            String path = "WEB-INF/offerta.jsp";
            dispatcher = request.getRequestDispatcher(path);
            dispatcher.forward(request, response);
            return;
        }
        int idasta = 0;
        try{
            idasta = Integer.parseInt(id);
        }
        catch(NumberFormatException e){
            request.setAttribute("errorMessage", e.getMessage());
            String path = "WEB-INF/offerta.jsp";
            dispatcher = request.getRequestDispatcher(path);
            dispatcher.forward(request, response);
            return;
        }
        ArticoloDAO articoloDAO = new ArticoloDAO(con);
        OffertaDAO offertaDAO = new OffertaDAO(con);
        List<Articolo> articoli;
        List<Offerta> offerta;
        try {
            articoli = articoloDAO.getArticoliByAsta(idasta);
            offerta = offertaDAO.getOfferta(idasta);
        } catch (SQLException e) {
            request.setAttribute("errorMessage", e.getMessage());
            String path = "WEB-INF/offerta.jsp";
            dispatcher = request.getRequestDispatcher(path);
            dispatcher.forward(request, response);
            return;
        }
        request.setAttribute("articoli", articoli);
        request.setAttribute("offerte", offerta);
        String path = "WEB-INF/offerta.jsp";
        dispatcher = request.getRequestDispatcher(path);
        dispatcher.forward(request, response);
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String id = request.getParameter("idasta");
        String offerta = request.getParameter("offertaprezzo");
        if (id == null || offerta == null) {
            request.getSession().setAttribute("errorMessage", "Un parametro è null, non è accettato");
            response.sendRedirect(request.getContextPath() + "/Offerta");
            return;
        }
        int idasta = 0, offertaprezzo = 0;
        try{
            idasta = Integer.parseInt(id);
            offertaprezzo = Integer.parseInt(offerta);
        }
        catch(NumberFormatException e){
            request.getSession().setAttribute("errorMessage", "Formato numerico non valido");
            response.sendRedirect(request.getContextPath() + "/Offerta?idasta=" + idasta);
            return;
        }
        OffertaDAO oDao = new OffertaDAO(con);
        try {
            oDao.insertOfferta(request.getSession().getAttribute("user").toString(), offertaprezzo, idasta);
        } catch (SQLException e) {
            request.getSession().setAttribute("errorMessage", e.getMessage());
            response.sendRedirect(request.getContextPath() + "/Offerta?idasta=" + idasta);
            return;
        }
        response.sendRedirect(request.getContextPath() + "/Offerta?idasta=" + idasta);
    }
}
