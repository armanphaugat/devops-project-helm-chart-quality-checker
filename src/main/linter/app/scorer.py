"""
Calculates a quality score (0–100) and grade based on issues found.
Deductions: HIGH=20pts, MEDIUM=10pts, LOW=5pts
"""

SEVERITY_WEIGHTS = {
    "HIGH": 20,
    "MEDIUM": 10,
    "LOW": 5
}

def calculate_score(issues: list) -> dict:
    total_deductions = sum(SEVERITY_WEIGHTS.get(i["severity"], 0) for i in issues)
    score = max(0, 100 - total_deductions)

    if score >= 90:
        grade = "A"
    elif score >= 75:
        grade = "B"
    elif score >= 60:
        grade = "C"
    elif score >= 40:
        grade = "D"
    else:
        grade = "F"

    high = sum(1 for i in issues if i["severity"] == "HIGH")
    medium = sum(1 for i in issues if i["severity"] == "MEDIUM")
    low = sum(1 for i in issues if i["severity"] == "LOW")

    return {
        "score": score,
        "grade": grade,
        "total_issues": len(issues),
        "breakdown": {"HIGH": high, "MEDIUM": medium, "LOW": low}
    }