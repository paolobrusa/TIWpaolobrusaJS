package it.polimi.tiwpaolobrusajs.controllers.filterAndUtils;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import it.polimi.tiwpaolobrusajs.dao.ArticoloDAO;
import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.File;
import java.io.IOException;
import java.io.Serial;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.UUID;

@WebServlet ("/AddArticolo")
@MultipartConfig
public class AddArticolo extends HttpServlet {
    @Serial
    private static final long serialVersionUID = 1L;
    private Connection con = null;
    private static final String dir = System.getProperty("user.home") + File.separator + "TIWImage";

    public AddArticolo() {
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
        String n = request.getParameter("nome");
        String d = request.getParameter("descrizione");
        String o = request.getSession().getAttribute("user").toString();
        String p = request.getParameter("prezzo");
        if (n == null || d == null || o == null || p == null) {
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree("Parametri non validi"));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        if(n.length() > 50 || d.length() > 255 || n.isEmpty() || d.isEmpty()) {
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree("Lunghezza attributi non valida, accorcia"));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        int prezzo;
        try {
            prezzo = Integer.parseInt(p);
        }
        catch (NumberFormatException e){
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree("Formato non valido"));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        if(prezzo <= 0){
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree("Prezzo non puo essere negativo"));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        Part image = request.getPart("immagine");
        if(image == null || (!image.getContentType().equals("image/jpeg") && !image.getContentType().equals("image/png"))){
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree("Immagine non valida (png/jpeg)"));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        String path = UUID.randomUUID() + "." + image.getContentType().replace("image/", "");
        File upload = new File(dir);
        if (!upload.exists()) {
            boolean a = upload.mkdir();
            if (!a) {
                JsonObject jsonResponse = new JsonObject();
                jsonResponse.addProperty("success", false);
                jsonResponse.add("message", gson.toJsonTree("Errore creazione cartella"));
                response.getWriter().write(gson.toJson(jsonResponse));
                return;
            }
        }
        String filePath = dir + File.separator + path;
        image.write(filePath);
        ArticoloDAO aDAO = new ArticoloDAO(con);
        try {
            aDAO.addArticolo(n, d, o, path, prezzo);
        } catch (SQLException e) {
            JsonObject jsonResponse = new JsonObject();
            jsonResponse.addProperty("success", false);
            jsonResponse.add("message", gson.toJsonTree(e.getMessage()));
            response.getWriter().write(gson.toJson(jsonResponse));
            return;
        }
        JsonObject jsonResponse = new JsonObject();
        jsonResponse.addProperty("success", true);
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
