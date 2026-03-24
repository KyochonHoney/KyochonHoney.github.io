/**
 * 팀 편성 알고리즘 (완전 랜덤 + 자동 밸런스)
 * 2팀 또는 3팀 자동 분배
 */

class TeamBalancer {
    /**
     * 팀 편성 (랜덤 + 밸런스)
     * @param {Array} members - 멤버 배열
     * @param {Number} teamCount - 팀 수 (2 또는 3, 기본값 2)
     * @returns {Object} - 팀 편성 결과
     */
    static generateBalancedTeams(members, teamCount = 2) {
        if (!members || members.length < 2) {
            return {
                success: false,
                message: '최소 2명 이상의 멤버가 필요합니다.'
            };
        }

        // 팀 수 검증
        if (![2, 3].includes(teamCount)) {
            teamCount = 2; // 기본값
        }

        // 전원 경기 참여 (벤치 없음) - 팀 수로 나누어떨어지지 않으면 일부 팀이 1명 더 많음
        // 매번 다른 결과를 위해 한 번만 랜덤 셔플 후 바로 분배
        const randomMembers = this.shuffleArray([...members]);
        const teams = this.distributeTeams(randomMembers, teamCount);

        return this.formatResult(teams, teamCount, []);
    }

    /**
     * 벤치 선수 분리
     * 인원이 팀 수로 나누어떨어지지 않으면, 중간 레벨 선수를 벤치로 이동
     * 예: 17명, 3팀 → 5:5:5 (15명) + 벤치 2명
     */
    static separateBenchPlayers(members, teamCount) {
        const totalMembers = members.length;
        const playersPerTeam = Math.floor(totalMembers / teamCount);
        const playingCount = playersPerTeam * teamCount;
        const benchCount = totalMembers - playingCount;

        if (benchCount === 0) {
            // 나누어떨어지면 벤치 없음
            return { playingMembers: members, benchMembers: [] };
        }

        // 레벨 기준으로 정렬 (오름차순)
        const sortedMembers = [...members].sort((a, b) => a.level - b.level);

        // 중간 레벨 선수들을 벤치로 (너무 잘하거나 못하는 선수는 경기에 참여)
        const middleIndex = Math.floor(sortedMembers.length / 2);
        const benchStartIndex = middleIndex - Math.floor(benchCount / 2);

        const benchMembers = sortedMembers.slice(benchStartIndex, benchStartIndex + benchCount);
        const playingMembers = [
            ...sortedMembers.slice(0, benchStartIndex),
            ...sortedMembers.slice(benchStartIndex + benchCount)
        ];

        return { playingMembers, benchMembers };
    }

    /**
     * 배열 랜덤 셔플 (Fisher-Yates)
     */
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * 팀 분배 (라운드 로빈 방식)
     */
    static distributeTeams(members, teamCount) {
        const teams = Array.from({ length: teamCount }, () => []);

        // 시작 팀을 랜덤으로 정해서 어느 팀이 1명 더 받을지 무작위로 결정
        const startTeam = Math.floor(Math.random() * teamCount);
        members.forEach((member, index) => {
            teams[(index + startTeam) % teamCount].push(member);
        });

        return teams;
    }

    /**
     * 팀 간 밸런스 계산 (레벨 차이의 합)
     */
    static calculateBalance(teams) {
        const levels = teams.map(team => this.calculateTeamLevel(team));
        const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;

        // 각 팀의 평균과의 차이 합계
        return levels.reduce((sum, level) => sum + Math.abs(level - avgLevel), 0);
    }

    /**
     * 팀 레벨 합계 계산
     */
    static calculateTeamLevel(team) {
        return team.reduce((sum, member) => sum + member.level, 0);
    }

    /**
     * 팀 통계 계산
     */
    static calculateTeamStats(team) {
        const positions = {
            ATT: 0,
            DEF: 0,
            ALL: 0
        };

        team.forEach(member => {
            if (positions.hasOwnProperty(member.position)) {
                positions[member.position]++;
            }
        });

        return {
            position_att: positions.ATT,
            position_def: positions.DEF,
            position_all: positions.ALL
        };
    }

    /**
     * 결과 포맷팅
     */
    static formatResult(teams, teamCount, benchMembers = []) {
        const result = {
            success: true,
            team_count: teamCount,
            teams: [],
            bench: benchMembers // 벤치 멤버 추가
        };

        const teamNames = ['A팀', 'B팀', 'C팀'];
        const teamColors = ['#28a745', '#17a2b8', '#e83e8c'];

        teams.forEach((team, index) => {
            const teamLevel = this.calculateTeamLevel(team);
            const teamStats = this.calculateTeamStats(team);

            result.teams.push({
                name: teamNames[index],
                color: teamColors[index],
                members: team,
                total_level: teamLevel,
                avg_level: (teamLevel / team.length).toFixed(1),
                member_count: team.length,
                ...teamStats
            });
        });

        // 레벨 차이 계산
        const levels = result.teams.map(t => t.total_level);
        const maxLevel = Math.max(...levels);
        const minLevel = Math.min(...levels);
        result.level_diff = (maxLevel - minLevel).toFixed(1);
        result.balance_quality = this.getBalanceQuality(maxLevel - minLevel);

        return result;
    }

    /**
     * 밸런스 품질 평가
     */
    static getBalanceQuality(levelDiff) {
        if (levelDiff <= 3) return 'excellent';
        if (levelDiff <= 6) return 'good';
        if (levelDiff <= 10) return 'fair';
        return 'poor';
    }

    /**
     * 밸런스 품질 텍스트
     */
    static getBalanceQualityText(quality) {
        const texts = {
            excellent: '매우 좋음',
            good: '좋음',
            fair: '보통',
            poor: '나쁨'
        };
        return texts[quality] || '알 수 없음';
    }

    /**
     * 밸런스 품질 색상
     */
    static getBalanceQualityColor(quality) {
        const colors = {
            excellent: '#28a745',
            good: '#17a2b8',
            fair: '#ffc107',
            poor: '#dc3545'
        };
        return colors[quality] || '#6c757d';
    }
}

// 전역으로 사용 가능하도록
window.TeamBalancer = TeamBalancer;
