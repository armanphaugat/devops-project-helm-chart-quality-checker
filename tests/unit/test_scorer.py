import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../src/main/linter"))

from app.scorer import calculate_score

def test_perfect_score():
    result = calculate_score([])
    assert result["score"] == 100
    assert result["grade"] == "A"

def test_high_issue_deduction():
    result = calculate_score([{"severity": "HIGH"}])
    assert result["score"] == 80

def test_medium_issue_deduction():
    result = calculate_score([{"severity": "MEDIUM"}])
    assert result["score"] == 90

def test_low_issue_deduction():
    result = calculate_score([{"severity": "LOW"}])
    assert result["score"] == 95

def test_grade_b():
    # 100 - 20(HIGH) - 5(LOW) = 75 -> B
    result = calculate_score([{"severity": "HIGH"}, {"severity": "LOW"}])
    assert result["score"] == 75
    assert result["grade"] == "B"

def test_grade_f():
    result = calculate_score([{"severity": "HIGH"}] * 5)
    assert result["grade"] == "F"
    assert result["score"] == 0

def test_score_never_below_zero():
    result = calculate_score([{"severity": "HIGH"}] * 20)
    assert result["score"] == 0

def test_breakdown_counts():
    issues = [{"severity": "HIGH"}, {"severity": "HIGH"}, {"severity": "MEDIUM"}, {"severity": "LOW"}]
    result = calculate_score(issues)
    assert result["breakdown"]["HIGH"]   == 2
    assert result["breakdown"]["MEDIUM"] == 1
    assert result["breakdown"]["LOW"]    == 1
    assert result["total_issues"]        == 4