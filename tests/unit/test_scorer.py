import sys
sys.path.insert(0, 'src/main/linter')
from app.scorer import calculate_score

def test_perfect_score():
    result = calculate_score([])
    assert result["score"] == 100
    assert result["grade"] == "A"

def test_high_issue_deduction():
    issues = [{"severity": "HIGH"}]
    result = calculate_score(issues)
    assert result["score"] == 80

def test_grade_f():
    issues = [{"severity": "HIGH"}] * 5
    result = calculate_score(issues)
    assert result["grade"] == "F"
    assert result["score"] == 0