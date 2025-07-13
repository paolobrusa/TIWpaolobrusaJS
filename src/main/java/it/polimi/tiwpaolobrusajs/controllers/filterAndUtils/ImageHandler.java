package it.polimi.tiwpaolobrusajs.controllers.filterAndUtils;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.Serial;

@WebServlet("/Image/*")
public class ImageHandler extends HttpServlet {
    @Serial
    private static final long serialVersionUID = 1L;
    private static final String dir = System.getProperty("user.home") + File.separator + "TIWImage";

    public void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        String contentType = getServletContext().getMimeType(path.substring(1));
        File image = new File(dir, path.substring(1));
        if(!image.exists()){
            return;
        }
        if (contentType == null) {
            return;
        }
        Image image1 = ImageIO.read(image);
        int height = 75;
        int width = 75;
        image1 = image1.getScaledInstance(width, height, Image.SCALE_SMOOTH);
        BufferedImage imageb = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        imageb.getGraphics().drawImage(image1, 0, 0, null);
        resp.setContentType(contentType);
        ImageIO.write(imageb, path.substring(path.lastIndexOf('.')+1), resp.getOutputStream());
    }

    public void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        doGet(req, resp);
    }
}
