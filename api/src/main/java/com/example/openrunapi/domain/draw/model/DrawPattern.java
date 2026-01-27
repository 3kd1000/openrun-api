package com.example.openrunapi.domain.draw.model;

import java.util.List;
import java.util.Map;

public final class DrawPattern {
    // public static final 
    public static final Map<Integer, List<String>> AA_PATTERNS = Map.ofEntries(
    Map.entry(4, List.of("12:34", "24:13", "41:32")),
    Map.entry(5, List.of("12:34", "13:25", "14:35", "15:24", "23:45")),
    Map.entry(6, List.of("12:34", "15:46", "23:56", "14:25", "24:36", "16:35")),
    Map.entry(7, List.of("12:34", "56:17", "35:24", "14:67", "23:57", "16:25", "46:37")),
    Map.entry(8, List.of("12:34", "56:78", "13:57", "24:68", "37:48", "15:26", "16:38", "25:47")),
    Map.entry(9, List.of("12:34", "56:78", "19:57", "23:68", "49:38", "15:26", "17:89", "36:45", "24:79")),
    Map.entry(10, List.of("12:34", "56:78", "23:6A", "19:58", "3A:45", "27:89", "4A:68", "13:79", "46:59", "17:2A")),
    Map.entry(11, List.of("12:34", "56:78", "5A:9B", "37:48", "14:89", "26:AB", "13:5B", "29:67", "18:2A", "3B:79", "45:6A")),
    Map.entry(12, List.of("12:34", "56:78", "9A:BC", "19:8A", "24:7C", "35:6B", "1C:7B", "2A:68", "39:45", "1A:25", "36:9C", "47:8B")),
    Map.entry(13, List.of("12:34", "56:78", "9A:BC", "15:2D", "36:49", "7B:8C", "1D:6A", "23:7C", "45:9B", "24:8A", "37:BD", "16:5C", "89:AD")),
    Map.entry(14, List.of("12:34", "56:78", "9A:BC", "1D:2E", "35:46", "79:8A", "1B:CD", "23:5E", "49:67", "13:7B", "45:AC", "89:DE", "8E:AB", "2D:6C")),
    Map.entry(15, List.of("12:34", "56:78", "9A:BC", "DE:1F", "23:57", "46:AB", "8D:9E", "4F:5C", "13:6B", "27:8A", "9C:5E", "36:DF", "1B:8C", "47:EF", "2A:9D")),
    Map.entry(16, List.of("12:34", "56:78", "9A:BC", "DE:FG", "13:57", "24:68", "9B:DF", "AC:EG", "19:6E", "2A:5D", "3B:8G", "4C:7F", "1E:8B", "2D:7C", "69:3G", "5A:4F"))
    );
    public static final Map<Integer, List<String>> AB_PATTERNS = Map.ofEntries(
        Map.entry(8, List.of("1A:2B", "3C:4D", "1B:3D", "2A:4C", "1C:4B", "2D:3A", "1D:4A", "3B:2C")),
        Map.entry(10, List.of("1A:2B", "3C:4D", "5E:1B", "2A:3D", "4C:5B", "1E:3A", "2D:4B", "3E:5C", "1D:4E", "2C:5A")),
        Map.entry(12, List.of("1A:2B", "3C:4D", "5E:6F", "1B:3D", "2A:5F", "4C:6E", "1C:5A", "3F:6B", "2D:4E", "3B:5C", "1D:4F", "2E:6A")),
        Map.entry(14, List.of("1A:2B", "3C:4D", "5E:6F", "7G:1B", "2A:3D", "4C:5F", "6E:7A", "1G:5C", "2D:4F", "3G:6B", "7E:2C", "1F:4A", "5G:3E", "6D:7B")),
        Map.entry(16, List.of("1A:2B", "3C:4D", "5E:6F", "7G:8H", "1B:3D", "2A:4C", "5F:7H", "6E:8G", "1D:4A", "2F:3G", "6B:7C", "5H:8E", "1G:5C", "2H:6D", "3E:7A", "4F:8B"))
    );
    public static final Map<Integer, List<String>> SEED_POSITIONS = Map.ofEntries(
        Map.entry(6, List.of("1", "3")),
        Map.entry(7, List.of("1", "5")),
        Map.entry(8, List.of("1", "7")),
        Map.entry(9, List.of("1", "4", "8")),
        Map.entry(10, List.of("1", "8", "A")),
        Map.entry(11, List.of("2", "3", "5", "8")),
        Map.entry(12, List.of("2", "3", "8", "C")),
        Map.entry(13, List.of("1", "4", "7", "A")),
        Map.entry(14, List.of("1", "4", "7", "A", "E")),
        Map.entry(15, List.of("1", "4", "5", "A", "D")),
        Map.entry(16, List.of("1", "4", "6", "7", "B", "D"))
    );

    public static final String[] BRACKET_NUMBERS = {
        "1","2","3","4","5","6","7","8","9",
        "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"
    };
}
 