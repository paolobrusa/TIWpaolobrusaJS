package it.polimi.tiwpaolobrusajs.dao;

import it.polimi.tiwpaolobrusajs.beans.Offerta;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class OffertaDAO {
    private final Connection connection;

    public OffertaDAO(Connection connection) {
        this.connection = connection;
    }

    public List<Offerta> getOfferta(int idasta) throws SQLException {
        List<Offerta> offerta = new ArrayList<Offerta>();
        String query = "SELECT usnutente, offertaprezzo, dataora FROM Offerta WHERE idasta = ? ORDER BY dataora DESC";
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            ps = connection.prepareStatement(query);
            ps.setInt(1, idasta);
            rs = ps.executeQuery();
            while (rs.next()) {
                Offerta o = new Offerta(rs.getString("usnutente"), rs.getInt("offertaprezzo"), rs.getDate("dataora"));
                offerta.add(o);
            }
        }
        catch (SQLException e) {
            throw new SQLException("Cant't get offerta");
        }
        finally {
            try{
                if(rs != null) rs.close();
            }catch (SQLException e){
                throw new SQLException("Error closing resultSet");
            }
            try{
                if(ps != null) ps.close();
            }catch (SQLException e){
                throw new SQLException("Error closing statement");
            }
        }
        return offerta;
    }

    public List<Offerta> getOfferteAggiudicate(String user) throws SQLException {
        List<Offerta> offerta = new ArrayList<Offerta>();
        String query = "SELECT usnutente, offertaprezzo, dataora, idasta FROM Offerta o JOIN asta ON idasta = id WHERE stato = 'chiusa' AND usnutente = ? AND o.offertaprezzo = (SELECT MAX(o2.offertaprezzo) FROM Offerta o2 WHERE o2.idasta = o.idasta) ORDER BY offertaprezzo DESC, dataora DESC";
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            ps = connection.prepareStatement(query);
            ps.setString(1, user);
            rs = ps.executeQuery();
            while (rs.next()) {
                Offerta o = new Offerta(rs.getString("usnutente"), rs.getInt("offertaprezzo"), rs.getDate("dataora"));
                o.setIdAsta(rs.getInt("idasta"));
                offerta.add(o);
            }
        }
        catch (SQLException e) {
            throw new SQLException("Cant't get offerta");
        }
        finally {
            try{
                if(rs != null) rs.close();
            }catch (SQLException e){
                throw new SQLException("Error closing resultSet");
            }
            try{
                if(ps != null) ps.close();
            }catch (SQLException e){
                throw new SQLException("Error closing statement");
            }
        }
        return offerta;
    }

    public void insertOfferta(String usnutente, int offertaprezzo, int idasta) throws SQLException {
        String query = "INSERT into offerta (usnutente, offertaprezzo, idasta, dataora) SELECT ?, ?, ?, NOW() WHERE ? >= (SELECT COALESCE(MAX(o.offertaprezzo), a.prezzoiniziale) + a.rialzomin FROM asta a LEFT JOIN offerta o ON a.id = o.idasta WHERE a.id = ? AND a.stato = 'attiva')";
        PreparedStatement ps = null;
        try{
            ps = connection.prepareStatement(query);
            ps.setString(1, usnutente);
            ps.setInt(2, offertaprezzo);
            ps.setInt(3, idasta);
            ps.setInt(4, offertaprezzo);
            ps.setInt(5, idasta);
            int i = ps.executeUpdate();
            if (i == 0) {
                throw new SQLException();
            }
        }
        catch (SQLException e) {
            throw new SQLException("L offerta deve essere maggiore dell ultima offerta piu rialzomin");
        }
        finally {
            try{
                if(ps != null) ps.close();
            }catch (SQLException e){
                throw new SQLException("Error closing statement");
            }
        }
    }
}
