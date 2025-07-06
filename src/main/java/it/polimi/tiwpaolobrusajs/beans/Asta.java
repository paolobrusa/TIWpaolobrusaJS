package it.polimi.tiwpaolobrusajs.beans;

import java.util.Date;
import java.util.List;

public class Asta {
    private int id;
    private List<Articolo> items;
    private int initialPrice;
    private int minBid;
    private Date date;
    private State state;
    private String timeLeft;

    public Asta(int id, int initialPrice, int minBid, Date date, State state) {
        this.id = id;
        this.initialPrice = initialPrice;
        this.minBid = minBid;
        this.date = date;
        this.state = state;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public List<Articolo> getItems() {
        return items;
    }

    public void setItems(List<Articolo> items) {
        this.items = items;
    }

    public int getInitialPrice() {
        return initialPrice;
    }

    public void setInitialPrice(int initialPrice) {
        this.initialPrice = initialPrice;
    }

    public int getMinBid() {
        return minBid;
    }

    public void setMinBid(int minBid) {
        this.minBid = minBid;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public State getState() {
        return state;
    }

    public void setState(State state) {
        this.state = state;
    }

    public String getTimeLeft() {
        return timeLeft;
    }

    public void setTimeLeft(String timeLeft) {
        this.timeLeft = timeLeft;
    }
}
