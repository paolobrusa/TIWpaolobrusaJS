package it.polimi.tiwpaolobrusajs.dao;

import it.polimi.tiwpaolobrusajs.beans.Articolo;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ArticoloDAO {
    private final Connection connection;

    public ArticoloDAO(Connection connection) {
        this.connection = connection;
    }

    public List<Articolo> getArticoli(String username) throws SQLException {
        List<Articolo> articoli = new ArrayList<Articolo>();
        String query = "SELECT codice, nome, descrizione, immaginepath, prezzo FROM articolo LEFT JOIN articolilista ON codice = codarticolo WHERE proprietario = ? AND codarticolo IS NULL";
        PreparedStatement ps = null;
        ResultSet rs = null;
        try{
            ps = connection.prepareStatement(query);
            ps.setString(1, username);
            rs = ps.executeQuery();
            while(rs.next()){
                Articolo a = new Articolo(rs.getInt("codice"), rs.getString("nome"), rs.getString("descrizione"), rs.getString("immaginepath"), rs.getInt("prezzo"));
                articoli.add(a);
            }
        } catch (SQLException e) {
            throw new SQLException(e);
        }
        return articoli;
    }

    public List<Articolo> getArticoli(List<Integer> ids) throws SQLException {
        List<Articolo> articoli = new ArrayList<Articolo>();
        String placeholders = ids.stream()
                .map(i -> "?")
                .collect(Collectors.joining(","));
        String query = "SELECT * FROM articolo WHERE codice IN (" + placeholders + ")";
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            ps = connection.prepareStatement(query);
            for (int i = 0; i < ids.size(); i++) {
                ps.setInt(i + 1, ids.get(i));
            }
            rs = ps.executeQuery();
            while (rs.next()) {
                Articolo a = new Articolo(rs.getInt("codice"), rs.getString("nome"), rs.getString("descrizione"), rs.getString("immaginepath"), rs.getInt("prezzo"));
                articoli.add(a);
            }
        }
        catch (SQLException e){
            throw new SQLException("Cant get articolo");
        }
        finally{
            try {
                if(ps != null) ps.close();
            } catch (SQLException e) {
                throw new SQLException("Close ps failed");
            }
            try{
                if(rs != null) rs.close();
            }
            catch (SQLException e){
                throw new SQLException("Close rs failed");
            }
        }
        return articoli;
    }

    public void addArticolo(String name, String description, String owner, String path, int price) throws SQLException {
        String query = "INSERT into articolo (proprietario, nome, descrizione, immaginepath, prezzo) values (?, ?, ?, ?, ?)";
        PreparedStatement ps = null;
        try {
            ps = connection.prepareStatement(query);
            ps.setString(1, owner);
            ps.setString(2, name);
            ps.setString(3, description);
            ps.setString(4, path);
            ps.setInt(5, price);
            ps.executeUpdate();
        }
        catch (SQLException e) {
            throw new SQLException(e);
        }
        finally {
            try{
                ps.close();
            }
            catch (SQLException e) {
                throw new SQLException(e);
            }
        }
    }

    public List<Articolo> getArticoliByAsta(int idAsta) throws SQLException {
        List<Articolo> articoli = new ArrayList<>();
        String query = "SELECT codice, nome, descrizione, immaginepath, prezzo FROM articolo JOIN articolilista ON codice = codarticolo WHERE idasta = ?";
        PreparedStatement ps = null;
        ResultSet rs = null;
        try{
            ps = connection.prepareStatement(query);
            ps.setInt(1, idAsta);
            rs = ps.executeQuery();
            while(rs.next()){
                Articolo a = new Articolo(rs.getInt("codice"), rs.getString("nome"), rs.getString("descrizione"), rs.getString("immaginepath"), rs.getInt("prezzo") );
                articoli.add(a);
            }
        }
        catch (SQLException e) {
            throw new SQLException("Cant get articoli");
        }
        finally{
            try {
                if(ps != null) ps.close();
            } catch (SQLException e) {
                throw new SQLException("Close ps failed");
            }
            try{
                if(rs != null) rs.close();
            }
            catch (SQLException e){
                throw new SQLException("Close rs failed");
            }
        }
        return articoli;
    }
}
