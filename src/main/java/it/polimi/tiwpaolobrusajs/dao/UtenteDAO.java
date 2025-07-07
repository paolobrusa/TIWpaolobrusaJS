package it.polimi.tiwpaolobrusajs.dao;

import it.polimi.tiwpaolobrusajs.beans.Utente;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class UtenteDAO {
    private final Connection connection;

    public UtenteDAO(Connection connection) {
        this.connection = connection;
    }

    public Utente getUtente(String username, String pwd) throws SQLException {
        Utente u = null;
        String query = "SELECT username, nome, cognome, indirizzo FROM Utente WHERE username = ? AND pwd = ?";
        ResultSet rs = null;
        PreparedStatement ps = null;
        try {
            ps = connection.prepareStatement(query);
            ps.setString(1, username);
            ps.setString(2, pwd);
            rs = ps.executeQuery();
            if (rs.next())
                u = new Utente(rs.getString("username"), rs.getString("nome"),rs.getString("cognome"),rs.getString("indirizzo"));
            else
                throw new SQLException("Username o password non validi"); //VOLENDO SI PUO MODIFICARE, TORNA NULL E CONTROLLI SU SERVER
        }catch (SQLException e){
            throw new SQLException(e);
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
        return u;
    }

    public Utente getWinner(String username) throws SQLException {
        Utente u = null;
        String query = "SELECT username, nome, cognome, indirizzo FROM Utente WHERE username = ?";
        ResultSet rs = null;
        PreparedStatement ps = null;
        try {
            ps = connection.prepareStatement(query);
            ps.setString(1, username);
            rs = ps.executeQuery();
            if (rs.next())
                u = new Utente(rs.getString("username"), rs.getString("nome"),rs.getString("cognome"),rs.getString("indirizzo"));
            else
                throw new SQLException("Non c'è l'aggiudicatario ");
        }catch (SQLException e){
            throw new SQLException(e);
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
        return u;
    }
}
