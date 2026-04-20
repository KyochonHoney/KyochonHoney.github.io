/**
 * 팀 편성 알고리즘
 * ① 완전 랜덤 셔플
 * ② 라운드 로빈 배분
 * ③ 레벨 밸런스 스왑 최적화 (excellent 도달 시 종료)
 * ④ 포지션 밸런스 스왑 (레벨 동일 선수 간만 — 레벨 밸런스 유지)
 * ⑤ extra 인원 완전 랜덤 배분
 */

class TeamBalancer {

    /**
     * 메인 진입점
     * excellent 결과가 나올 때까지 최대 100회 재시도
     * 100회 내 excellent 없으면 가장 좋은 결과 반환
     */
    static generateBalancedTeams(members, teamCount = 2) {
        if (!members || members.length < 2) {
            return { success: false, message: '최소 2명 이상의 멤버가 필요합니다.' };
        }
        if (![2, 3].includes(teamCount)) teamCount = 2;

        const MAX_ATTEMPTS = 100;
        let bestResult = null;
        let bestDiff = Infinity;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const result = this.attemptGenerate(members, teamCount);
            if (result.balance_quality === 'excellent') return result;
            const diff = parseFloat(result.level_diff);
            if (diff < bestDiff) {
                bestDiff = diff;
                bestResult = result;
            }
        }

        return bestResult;
    }

    /**
     * 팀 편성 1회 시도
     */
    static attemptGenerate(members, teamCount) {
        const total = members.length;
        const extraCount = total % teamCount;

        // ① 완전 랜덤 셔플 — 매번 다른 조합 보장
        const shuffled = this.shuffleArray(members);

        // ② base / extra 분리
        const baseMembers = shuffled.slice(0, total - extraCount);
        const extraMembers = shuffled.slice(total - extraCount);

        // ③ 라운드 로빈으로 base 배분
        const teams = Array.from({ length: teamCount }, () => []);
        baseMembers.forEach((member, i) => teams[i % teamCount].push(member));

        // ④ 레벨 밸런스 스왑 최적화
        this.optimizeLevelBalance(teams, teamCount);

        // ⑤ 포지션 밸런스 스왑 (레벨 동일 선수 간만)
        this.optimizePositionBalance(teams, teamCount);

        // ⑥ extra 완전 랜덤 배분
        this.randomDistributeExtras(extraMembers, teams, teamCount);

        return this.formatResult(teams, teamCount, extraCount);
    }

    /**
     * 레벨 밸런스 스왑 최적화
     * 두 팀 사이에서 레벨 합 차이를 줄이는 최적 스왑을 반복 탐색
     * 개선이 없거나 excellent 도달 시 종료
     */
    static optimizeLevelBalance(teams, teamCount) {
        const MAX_ITER = 500;

        for (let iter = 0; iter < MAX_ITER; iter++) {
            const levels = teams.map(t => this.calculateTeamLevel(t));
            const currentDiff = Math.max(...levels) - Math.min(...levels);

            if (currentDiff <= 3) break; // excellent 기준 (인원 동일 base 단계)

            let bestImprovement = 0;
            let bestSwap = null;

            for (let ti = 0; ti < teamCount; ti++) {
                for (let tj = ti + 1; tj < teamCount; tj++) {
                    for (let pi = 0; pi < teams[ti].length; pi++) {
                        for (let pj = 0; pj < teams[tj].length; pj++) {
                            const newLevels = [...levels];
                            newLevels[ti] = levels[ti] - teams[ti][pi].level + teams[tj][pj].level;
                            newLevels[tj] = levels[tj] - teams[tj][pj].level + teams[ti][pi].level;
                            const newDiff = Math.max(...newLevels) - Math.min(...newLevels);
                            const improvement = currentDiff - newDiff;
                            if (improvement > bestImprovement) {
                                bestImprovement = improvement;
                                bestSwap = { ti, tj, pi, pj };
                            }
                        }
                    }
                }
            }

            if (!bestSwap) break; // 더 이상 개선 불가

            const { ti, tj, pi, pj } = bestSwap;
            [teams[ti][pi], teams[tj][pj]] = [teams[tj][pj], teams[ti][pi]];
        }
    }

    /**
     * 포지션 밸런스 스왑
     * 레벨이 동일한 선수끼리만 교환 → 레벨 밸런스 유지 보장
     * 포지션 불균형 점수가 줄어드는 경우만 적용
     */
    static optimizePositionBalance(teams, teamCount) {
        const MAX_ITER = 100;

        for (let iter = 0; iter < MAX_ITER; iter++) {
            const currentScore = this.calculatePositionScore(teams);
            if (currentScore === 0) break;

            let improved = false;

            search:
            for (let ti = 0; ti < teamCount; ti++) {
                for (let tj = ti + 1; tj < teamCount; tj++) {
                    for (let pi = 0; pi < teams[ti].length; pi++) {
                        for (let pj = 0; pj < teams[tj].length; pj++) {
                            const mi = teams[ti][pi];
                            const mj = teams[tj][pj];

                            // 레벨 달라지면 스왑 금지
                            if (mi.level !== mj.level) continue;
                            // 포지션 같으면 의미 없음
                            if (mi.position === mj.position) continue;

                            [teams[ti][pi], teams[tj][pj]] = [teams[tj][pj], teams[ti][pi]];
                            const newScore = this.calculatePositionScore(teams);

                            if (newScore < currentScore) {
                                improved = true;
                                break search; // 개선 확인, 다음 iter로
                            }

                            // 개선 없으면 롤백
                            [teams[ti][pi], teams[tj][pj]] = [teams[tj][pj], teams[ti][pi]];
                        }
                    }
                }
            }

            if (!improved) break;
        }
    }

    /**
     * 포지션 불균형 점수
     * 각 팀 쌍에서 포지션별 인원 차이 합산
     * 0 = 완전 균형
     */
    static calculatePositionScore(teams) {
        let score = 0;
        const positions = ['ATT', 'DEF', 'ALL'];
        for (let ti = 0; ti < teams.length; ti++) {
            for (let tj = ti + 1; tj < teams.length; tj++) {
                positions.forEach(pos => {
                    const ci = teams[ti].filter(m => m.position === pos).length;
                    const cj = teams[tj].filter(m => m.position === pos).length;
                    score += Math.abs(ci - cj);
                });
            }
        }
        return score;
    }

    /**
     * extra 인원 완전 랜덤 배분
     * 레벨 고려 없이 어느 팀이 extra를 받을지만 랜덤 결정
     * 한 팀에 2명 이상 몰리지 않도록 팀 인덱스를 셔플해서 순서대로 배분
     */
    static randomDistributeExtras(extraMembers, teams, teamCount) {
        if (!extraMembers.length) return;
        const shuffledIndices = this.shuffleArray(Array.from({ length: teamCount }, (_, i) => i));
        extraMembers.forEach((member, i) => {
            teams[shuffledIndices[i % teamCount]].push(member);
        });
    }

    // ── 유틸 ──────────────────────────────────────────

    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    static calculateTeamLevel(team) {
        return team.reduce((sum, m) => sum + m.level, 0);
    }

    static calculateTeamStats(team) {
        const positions = { ATT: 0, DEF: 0, ALL: 0 };
        team.forEach(m => {
            if (positions.hasOwnProperty(m.position)) positions[m.position]++;
        });
        return { position_att: positions.ATT, position_def: positions.DEF, position_all: positions.ALL };
    }

    // ── 결과 포맷 ─────────────────────────────────────

    static formatResult(teams, teamCount, extraCount) {
        const result = {
            success: true,
            team_count: teamCount,
            has_extra: extraCount > 0,
            teams: []
        };

        const teamNames  = ['A팀', 'B팀', 'C팀'];
        const teamColors = ['#28a745', '#17a2b8', '#e83e8c'];

        teams.forEach((team, index) => {
            const totalLevel = this.calculateTeamLevel(team);
            const stats = this.calculateTeamStats(team);
            result.teams.push({
                name: teamNames[index],
                color: teamColors[index],
                members: team,
                total_level: totalLevel,
                avg_level: team.length ? (totalLevel / team.length).toFixed(1) : '0.0',
                member_count: team.length,
                ...stats
            });
        });

        // 팀 인원 동일 → 레벨 합 차이 / 다름 → 평균 레벨 차이
        const sizes = result.teams.map(t => t.member_count);
        const allSameSize = sizes.every(s => s === sizes[0]);

        if (allSameSize) {
            const levels = result.teams.map(t => t.total_level);
            result.level_diff = (Math.max(...levels) - Math.min(...levels)).toFixed(1);
            result.balance_metric = 'total';
        } else {
            const avgs = result.teams.map(t => parseFloat(t.avg_level));
            result.level_diff = (Math.max(...avgs) - Math.min(...avgs)).toFixed(1);
            result.balance_metric = 'avg';
        }

        result.balance_quality = this.getBalanceQuality(parseFloat(result.level_diff), allSameSize);
        return result;
    }

    static getBalanceQuality(diff, isSameSize) {
        if (isSameSize) {
            if (diff <= 3)  return 'excellent';
            if (diff <= 6)  return 'good';
            if (diff <= 10) return 'fair';
            return 'poor';
        } else {
            if (diff <= 0.5) return 'excellent';
            if (diff <= 1.0) return 'good';
            if (diff <= 2.0) return 'fair';
            return 'poor';
        }
    }

    static getBalanceQualityText(quality) {
        return { excellent: '매우 좋음', good: '좋음', fair: '보통', poor: '나쁨' }[quality] || '알 수 없음';
    }

    static getBalanceQualityColor(quality) {
        return { excellent: '#28a745', good: '#17a2b8', fair: '#ffc107', poor: '#dc3545' }[quality] || '#6c757d';
    }
}

window.TeamBalancer = TeamBalancer;
