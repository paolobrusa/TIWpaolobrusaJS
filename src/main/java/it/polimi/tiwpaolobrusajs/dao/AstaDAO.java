package it.polimi.tiwpaolobrusajs.dao;

import it.polimi.tiwpaolobrusajs.beans.Asta;
import it.polimi.tiwpaolobrusajs.beans.State;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class AstaDAO {
    private final Connection connection;

    public AstaDAO(Connection connection) {
        this.connection = connection;
    }

    public List<Asta> getAsteByIds(List<Integer> Ids) throws SQLException {
        List<Asta> aste = new ArrayList<>();
        String placeholders = Ids.stream()
                .map(i -> "?")
                .collect(Collectors.joining(","));
        String query = "SELECT * FROM Asta WHERE id IN (" + placeholders + ") AND stato = 'attiva' AND scadenza > now()";
        PreparedStatement ps = null;
        ResultSet rs = null;
        try{
            ps = connection.prepareStatement(query);
            for (int i = 0; i < Ids.size(); i++) {
                ps.setInt(i + 1, Ids.get(i));
            }
            rs = ps.executeQuery();
            Asta asta;
            while(rs.next()) {
                asta = new Asta(rs.getInt("id"), rs.getInt("prezzoiniziale"), rs.getInt("rialzomin"), rs.getDate("scadenza"), State.valueOf(rs.getString("stato")));
                aste.add(asta);
            }
        }
        catch (SQLException e){
            throw new SQLException("Asta not exist");
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
        return aste;
    }

    public State getState(int id, String user) throws SQLException {
        String query = "SELECT stato FROM Asta WHERE id = ? AND EXISTS (SELECT 1 FROM articolilista JOIN articolo ON codarticolo = codice WHERE proprietario <> ? AND idasta = id)";
        PreparedStatement ps = null;
        ResultSet rs = null;
        State s = null;
        try{
            ps = connection.prepareStatement(query);
            ps.setInt(1, id);
            ps.setString(2, user);
            rs = ps.executeQuery();
            if(rs.next()){
                s = State.valueOf(rs.getString("stato"));
            }
//            else{
//                throw new SQLException("Asta not found");
//            }
        }
        catch(SQLException e){
            throw new SQLException("Asta not exist");
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
        return s;
    }

    public Asta getAsta(int id, String user) throws SQLException {
        String query = "SELECT DISTINCT id, prezzoiniziale, rialzomin, scadenza, stato FROM Asta JOIN articolilista ON id = idasta JOIN articolo ON codarticolo = codice WHERE id = ? AND proprietario = ?";
        PreparedStatement ps = null;
        ResultSet rs = null;
        Asta a = null;
        try{
            ps = connection.prepareStatement(query);
            ps.setInt(1, id);
            ps.setString(2, user);
            rs = ps.executeQuery();
            if(rs.next()){
                a = new Asta(rs.getInt("id"), rs.getInt("prezzoiniziale"), rs.getInt("rialzomin"), rs.getDate("scadenza"), State.valueOf(rs.getString("stato")));
            }
            else{
                throw new SQLException("Asta not found");
            }
        }
        catch(SQLException e){
            throw new SQLException("Asta not exist");
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
        return a;
    }

    public List<Asta> getAste(String username) throws SQLException {
        List<Asta> asta = new ArrayList<Asta>();
        String query = " SELECT a.id, a.prezzoiniziale, a.rialzomin, a.scadenza, a.stato, " +
                "COALESCE(MAX(offertaprezzo), 0) as offertamax " +
                "FROM Asta a JOIN Articolilista al ON a.id = al.idasta JOIN Articolo ar ON al.codarticolo = ar.codice " +
                "LEFT JOIN Offerta o ON a.id = o.idasta " +
                "WHERE ar.proprietario = ? " +
                "GROUP BY a.id, a.prezzoiniziale, a.rialzomin, a.scadenza, a.stato " +
                "ORDER BY a.scadenza";
        PreparedStatement ps = null;
        ResultSet rs = null;
        try{
            ps = connection.prepareStatement(query);
            ps.setString(1, username);
            rs = ps.executeQuery();
            while (rs.next()) {
                Asta a = new Asta(rs.getInt("id"), rs.getInt("prezzoiniziale"), rs.getInt("offertamax"),
                        rs.getDate("scadenza"), State.valueOf(rs.getString("stato")));
                asta.add(a);
            }
        }
        catch (SQLException e) {
            throw new SQLException("Can't get Asta");
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
        return asta;
    }

    public int addAsta(int initialPrice, int minBid, LocalDateTime date) throws SQLException {
        String query = "INSERT into asta (prezzoiniziale, rialzomin, scadenza) values (?, ?, ?)";
        PreparedStatement ps = null;
        ResultSet rs = null;
        int idAsta = 0;
        try {
            ps = connection.prepareStatement(query, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, initialPrice);
            ps.setInt(2, minBid);
            ps.setObject(3, Timestamp.valueOf(date));
            ps.executeUpdate();
            rs = ps.getGeneratedKeys();
            if (rs.next()) {
                idAsta = rs.getInt(1);
            }
            else throw new SQLException("Can't add Asta");
        }
        catch (SQLException e) {
            throw new SQLException("Can't add Asta");
        }
        finally {
            try {
                if(ps != null) ps.close();
            } catch (SQLException e) {
                throw new SQLException("Error closing statement");
            }
            try{
                if(rs != null) rs.close();
            }
            catch (SQLException e){
                throw new SQLException("Error closing rs");
            }
        }
        return idAsta;
    }

    public void addArticoliAsta(int idAsta, List<Integer> cods, String user) throws SQLException {
        String query = "INSERT into articolilista (idasta, codarticolo) SELECT ?, ? WHERE EXISTS (SELECT 1 FROM articolo WHERE proprietario = ? AND codice = ?) AND NOT EXISTS (SELECT 1 FROM articolilista WHERE idasta = ? AND codarticolo = ?)";
        PreparedStatement ps = null;
        try{
            ps = connection.prepareStatement(query);
            for (Integer codArt : cods) {
                ps.setInt(1, idAsta);
                ps.setInt(2, codArt);
                ps.setString(3, user);
                ps.setInt(4, codArt);
                ps.setInt(5, idAsta);
                ps.setInt(6, codArt);
                ps.executeUpdate();
            }
        }
        catch (SQLException e) {
            throw new SQLException("Can't add Articoli");
        }
        finally {
            try{
                ps.close();
            }
            catch (SQLException e){
                throw new SQLException("Error closing statement");
            }
        }
    }

    public void closeState(int idAsta, String user) throws SQLException {
        String query = "UPDATE Asta SET stato = ? WHERE id = ? AND EXISTS (SELECT 1 FROM articolilista JOIN articolo ON codarticolo = codice WHERE proprietario = ? AND idasta = id) AND scadenza<NOW()";
        PreparedStatement ps = null;
        try{
            ps = connection.prepareStatement(query);
            ps.setString(1, State.chiusa.toString());
            ps.setInt(2, idAsta);
            ps.setString(3, user);
            int i = ps.executeUpdate();
            if(i == 0)
                throw new SQLException("Non puoi chiudere l'asta");
        }
        catch (SQLException e) {
            throw new SQLException(e);
        }
        finally {
            try{
                ps.close();
            }
            catch (SQLException e){
                throw new SQLException("Error closing statement");
            }
        }
    }

    public List<Asta> getAstaByKeyword(String keyword, String user) throws SQLException {
        List<Asta> aste = new ArrayList<>();
        String query = "SELECT DISTINCT id, prezzoiniziale, rialzomin, scadenza FROM Asta JOIN articolilista ON id = idasta JOIN articolo ON codarticolo = codice WHERE proprietario <> ? AND scadenza > NOW() AND stato = 'attiva' AND (nome LIKE ? OR descrizione LIKE ?) ORDER BY scadenza DESC";
        PreparedStatement ps = null;
        ResultSet rs = null;
        String key = "%"+keyword+"%";
        try{
            ps = connection.prepareStatement(query);
            ps.setString(1, user);
            ps.setString(2, key);
            ps.setString(3, key);
            rs = ps.executeQuery();
            while (rs.next()) {
                Asta a = new Asta(rs.getInt("id"), rs.getInt("prezzoiniziale"), rs.getInt("rialzomin"), rs.getDate("scadenza"), State.attiva);
                aste.add(a);
            }
        }
        catch (SQLException e) {
            throw new SQLException("Can't get Asta");
        }
        finally {
            try {
                if(ps != null) ps.close();
            } catch (SQLException e) {
                throw new SQLException("Error closing statement");
            }
            try{
                if(rs != null) rs.close();
            }
            catch (SQLException e){
                throw new SQLException("Error closing rs");
            }
        }
        return aste;
    }
}
