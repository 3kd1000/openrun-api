package com.example.openrunapi.domain.draw.model;

import java.util.List;
import java.util.Map;

public final class DrawPattern {
    // public static final 
    public static final Map<Integer, List<String>> AA_PATTERNS = Map.ofEntries(
    Map.entry(5, List.of("12:34", "13:25", "14:35", "15:24", "23:45")),
    Map.entry(6, List.of("12:34", "15:46", "23:56", "14:25", "24:36", "16:35")),
    Map.entry(7, List.of("12:34", "56:17", "35:24", "14:67", "23:57", "16:25", "46:37")),
    Map.entry(8, List.of("12:34", "56:78", "13:57", "24:68", "37:48", "15:26", "16:38", "25:47")),
    Map.entry(9, List.of("12:34", "56:78", "19:57", "23:68", "49:38", "15:26", "17:89", "36:45", "24:79")),
    Map.entry(10, List.of("12:34", "56:78", "23:6A", "19:58", "3A:45", "27:89", "4A:68", "13:79", "46:59", "17:2A")),
    Map.entry(11, List.of("12:34", "56:78", "1B:9A", "23:68", "4A:57", "26:9B", "13:5B", "49:8A", "17:28", "5A:6B", "39:47")),
    Map.entry(12, List.of("12:34", "56:78", "9A:BC", "37:48", "29:5A", "1B:6C", "13:57", "24:9B", "68:AC", "17:2B", "35:6A", "49:8C")),
    Map.entry(13, List.of("12:34", "56:78", "9A:BC", "1D:25", "37:4A", "68:9B", "CD:13", "26:5A", "47:8B", "9C:2D", "15:AB", "3C:67", "48:9D")),
    Map.entry(14, List.of("12:34", "56:78", "9A:BC", "DE:13", "24:57", "68:9B", "26:CD", "79:AE", "14:8B", "5E:6A", "3C:7B", "2D:89", "3E:45", "AC:1D")),
    Map.entry(15, List.of("12:34", "56:78", "9A:BC", "DE:1F", "23:57", "46:AB", "8D:9E", "4F:5C", "13:6B", "27:8A", "9C:5E", "36:DF", "1B:8C", "47:EF", "2A:9D")),
    Map.entry(16, List.of("12:34", "56:78", "9A:BC", "DE:FG", "13:57", "24:68", "9B:DF", "AC:EG", "15:9D", "37:BF", "26:AE", "48:CG", "19:2A", "5D:6E", "3B:4C", "7F:8G"))
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
        Map.entry(11, List.of("1", "5", "8", "9")),
        Map.entry(12, List.of("2", "3", "8", "A")),
        Map.entry(13, List.of("1", "4", "6", "B")),
        Map.entry(14, List.of("2", "5", "8", "C")),
        Map.entry(15, List.of("1", "4", "5", "A", "D")),
        Map.entry(16, List.of("1", "6", "B", "G", "7", "A"))
    );

    public static final String[] BRACKET_NUMBERS = {
        "1","2","3","4","5","6","7","8","9",
        "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"
    };
}
 