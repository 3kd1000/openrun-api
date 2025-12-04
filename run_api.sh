#!/bin/bash
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/openrun"
export SPRING_DATASOURCE_USERNAME="openrun"
export SPRING_DATASOURCE_PASSWORD="openrun123#"
export SPRING_PROFILES_ACTIVE="local"

./gradlew :api:bootRun
