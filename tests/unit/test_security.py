import sys
sys.path.insert(0, 'src/main/linter')
from app.checks.security import check_run_as_root, check_privileged

def test_root_user_detected():
    containers = [{"name": "app", "securityContext": {"runAsUser": 0}}]
    issues = check_run_as_root(containers)
    assert len(issues) == 1
    assert issues[0]["severity"] == "HIGH"

def test_safe_user_passes():
    containers = [{"name": "app", "securityContext": {"runAsUser": 1000}}]
    issues = check_run_as_root(containers)
    assert len(issues) == 0

def test_privileged_detected():
    containers = [{"name": "app", "securityContext": {"privileged": True}}]
    issues = check_privileged(containers)
    assert len(issues) == 1