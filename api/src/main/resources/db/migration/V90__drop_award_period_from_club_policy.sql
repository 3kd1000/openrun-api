-- 어워드 정산 주기를 랭킹 주기(ranking_period)로 일원화하면서 award_period 컬럼 제거
ALTER TABLE club_policy DROP COLUMN award_period;
