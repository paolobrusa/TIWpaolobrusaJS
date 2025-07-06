package it.polimi.tiwpaolobrusajs.controllers;

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
        String errorMessage = (String) request.getSession().getAttribute("errorMessage");
        if (errorMessage != null) {
            request.getSession().removeAttribute("errorMessage");
            request.setAttribute("errorMessage", errorMessage);
        }
        String id = request.getParameter("idasta");
        if (id == null) {
            request.setAttribute("errorMessage", "Errore imprevisto, assicurati di aver selezionato un asta");
            String path = "WEB-INF/dettaglioAsta.jsp";
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
            String path = "WEB-INF/dettaglioAsta.jsp";
            dispatcher = request.getRequestDispatcher(path);
            dispatcher.forward(request, response);
            return;
        }
        AstaDAO aDao = new AstaDAO(con);
        OffertaDAO oDao = new OffertaDAO(con);
        ArticoloDAO arDao = new ArticoloDAO(con);
        Asta asta;
        List<Offerta> o;
        List<Articolo> a;
        try {
            asta = aDao.getState(idasta, request.getSession().getAttribute("user").toString());
            o = oDao.getOfferta(idasta);
            a = arDao.getArticoliByAsta(idasta);
        } catch (SQLException e) {
            request.setAttribute("errorMessage", e.getMessage());
            String path = "WEB-INF/dettaglioAsta.jsp";
            dispatcher = request.getRequestDispatcher(path);
            dispatcher.forward(request, response);
            return;
        }
        if(asta != null && asta.getState() == State.attiva){
            String path = "WEB-INF/dettaglioAsta.jsp";
            request.setAttribute("asta", asta);
            request.setAttribute("offerte", o);
            request.setAttribute("articoli", a);
            dispatcher = request.getRequestDispatcher(path);
            dispatcher.forward(request, response);
        }
        else if(asta != null && asta.getState() == State.chiusa){
            UtenteDAO uDao = new UtenteDAO(con);
            Offerta winner = null;
            winner = o.stream().max(Comparator.comparing(Offerta::getBid)).orElse(null);
            request.setAttribute("asta", asta);
            request.setAttribute("offerte", o);
            request.setAttribute("articoli", a);
            Utente u = null;
            if (winner != null) {
                try {
                    u = uDao.getWinner(winner.getUsnUser());
                } catch (SQLException e) {
                    e.printStackTrace();
                    request.setAttribute("errorMessage", "Non c'è l'aggiudicatario");
                    String path = "WEB-INF/dettaglioAsta.jsp";
                    dispatcher = request.getRequestDispatcher(path);
                    dispatcher.forward(request, response);
                    return;
                }
                request.setAttribute("utente", u);
            }
            request.setAttribute("offertaVincente", winner);
            String path = "WEB-INF/dettaglioAsta.jsp";
            dispatcher = request.getRequestDispatcher(path);
            dispatcher.forward(request, response);
        }
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String idAsta = request.getParameter("idAsta");
        int idasta = 0;
        if (idAsta == null) return;
        try {
            idasta = Integer.parseInt(idAsta);
        }
        catch(NumberFormatException e){
            request.getSession().setAttribute("errorMessage", "Formato id non valido");
            response.sendRedirect(request.getContextPath() + "/Dettaglio");
            return;
        }
        AstaDAO astaDAO = new AstaDAO(con);
        try {
            astaDAO.closeState(idasta);
        } catch (SQLException e) {
            request.getSession().setAttribute("errorMessage", e.getMessage());
            response.sendRedirect(request.getContextPath() + "/Dettaglio");
            return;
        }
        response.sendRedirect(request.getContextPath() + "/Dettaglio?idasta=" + idasta);
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
