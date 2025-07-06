package it.polimi.tiwpaolobrusajs.controllers.filterAndUtils;

import it.polimi.tiwpaolobrusajs.beans.Asta;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

public class TimeLeft {
    public static void timeLeft(List<Asta> aste){
        LocalDateTime now = LocalDateTime.now();
        for (Asta asta : aste) {
            java.util.Date utilDate = new java.util.Date(asta.getDate().getTime());
            Duration duration = Duration.between(now, utilDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime());
            String d;
            if(duration.isNegative()){
                d = "FINITO";
            }
            else {
                d = duration.toDays() + ":" + duration.toHoursPart() + ":" + duration.toMinutesPart() + ":" + duration.toSecondsPart();
            }
            asta.setTimeLeft(d);
        }
    }
}
