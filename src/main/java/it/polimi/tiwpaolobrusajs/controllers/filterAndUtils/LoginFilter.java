package it.polimi.tiwpaolobrusajs.controllers.filterAndUtils;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Arrays;

@WebFilter("/*")
public class LoginFilter implements Filter {

    private static final String[] paths = {"/Homepage", "/Vendo", "/css/aste.css",
            "/css/homepage.css", "/Logout", "/Dettaglio", "/css/dettaglioasta.css", "/AddArticolo",
            "/CreateAsta", "/Acquisto", "/css/acquisto.css", "/Offerta", "/css/offerta.css", "/scripts/spa.js"};

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        HttpServletRequest request  = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        String path = request.getRequestURI().substring(request.getContextPath().length());
        //System.out.println(path);
        if ((path.equals("/Login") || path.equals("/css/login.css") || path.equals("/scripts/login.js")) && request.getSession().getAttribute("user") == null) {
            filterChain.doFilter(request, response);
        }
        else if (request.getSession().getAttribute("user") != null && request.getSession(false) != null && Arrays.asList(paths).contains(path)){
            filterChain.doFilter(request, response);
        }
        else if (request.getSession().getAttribute("user") != null && request.getSession(false) != null) {
            response.sendRedirect(request.getContextPath() + "/Homepage");
        }
        else {
            response.sendRedirect(request.getContextPath() + "/Login");
        }
    }

}
