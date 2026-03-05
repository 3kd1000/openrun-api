package com.example.openrunapi.domain.calendar.repository;

import com.example.openrunapi.domain.calendar.model.CalendarConnection;
import com.example.openrunapi.domain.calendar.model.CalendarProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CalendarConnectionRepository extends JpaRepository<CalendarConnection, Long> {

    Optional<CalendarConnection> findByUserIdAndProvider(Long userId, CalendarProvider provider);

    List<CalendarConnection> findByUserIdAndActiveTrue(Long userId);

    List<CalendarConnection> findByUserId(Long userId);

    Optional<CalendarConnection> findByUserIdAndProviderAndActiveTrue(Long userId, CalendarProvider provider);
}
