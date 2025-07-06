package it.polimi.tiwpaolobrusajs.beans;

import java.util.Date;

public class Offerta {
    private String usnUser;
    private int bid;
    private int idAsta;
    private Date date;

    public Offerta(String usnUser, int bid, Date date) {
        this.usnUser = usnUser;
        this.bid = bid;
        this.date = date;
    }

    public String getUsnUser() {
        return usnUser;
    }

    public void setUsnUser(String usnUser) {
        this.usnUser = usnUser;
    }

    public int getBid() {
        return bid;
    }

    public void setBid(int bid) {
        this.bid = bid;
    }

    public Date getDate() {return date;}

    public void setDate(Date date) {this.date = date;}

    public int getIdAsta() {
        return idAsta;
    }

    public void setIdAsta(int idAsta) {
        this.idAsta = idAsta;
    }
}
