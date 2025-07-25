package com.example.openrunapi.domain.draw.model.request;

import java.util.List;

import com.example.openrunapi.domain.draw.model.DrawType;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateDrawRequest {
    private List<String> userNames;
    //추후에는 userIds로 변경

    private List<String> seedUserNames; //Seeded 인 경우 시드 플레이어 이름 리스트

    private DrawType drawType; //Single, Double, Seeded 여부 

    private List<String> groupAUserNames; //Double 인 경우 그룹 A 플레이어 이름 리스트

    private List<String> groupBUserNames; //Double 인 경우 그룹 B 플레이어 이름 리스트

    private Integer numberOfTotalPlayer; // 총 플레이어 수

}

