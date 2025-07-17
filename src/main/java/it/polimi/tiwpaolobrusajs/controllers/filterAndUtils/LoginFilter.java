package it.polimi.tiwpaolobrusajs.controllers.filterAndUtils;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Arrays;

@WebFilter("/*")
public class LoginFilter implements Filter {

    private static final String[] paths = {"/Homepage", "/Vendo", "/Logout", "/Dettaglio", "/AddArticolo",
            "/CreateAsta", "/Acquisto", "/Offerta", "/scripts/spa.js", "/css/style.css", "/AsteVisitate"};

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        HttpServletRequest request  = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        String path = request.getRequestURI().substring(request.getContextPath().length());
        if ((path.equals("/Login") || path.equals("/css/style.css") || path.equals("/scripts/login.js")) && request.getSession().getAttribute("user") == null) {
            filterChain.doFilter(request, response);
        }
        else if (request.getSession().getAttribute("user") != null && request.getSession(false) != null && (Arrays.asList(paths).contains(path) || path.startsWith("/Image/"))){
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
