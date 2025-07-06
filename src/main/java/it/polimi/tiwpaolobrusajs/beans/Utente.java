package it.polimi.tiwpaolobrusajs.beans;

public class Utente {
    private String username;
    private String pwd;
    private String name;
    private String surname;
    private String address;

    public Utente(String username, String name, String surname, String address) {
        this.username = username;
        this.name = name;
        this.surname = surname;
        this.address = address;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPwd() {
        return pwd;
    }

    public void setPwd(String pwd) {
        this.pwd = pwd;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSurname() {
        return surname;
    }

    public void setSurname(String surname) {
        this.surname = surname;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}
