import sys, os
# FIX: use __file__-relative path so tests work from any directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../src/main/linter"))

from app.checks.security import check_run_as_root, check_privileged, check_host_network

def test_root_user_detected():
    containers = [{"name": "app", "securityContext": {"runAsUser": 0}}]
    issues = check_run_as_root(containers)
    assert len(issues) == 1
    assert issues[0]["severity"] == "HIGH"

def test_safe_user_passes():
    containers = [{"name": "app", "securityContext": {"runAsUser": 1000}}]
    assert len(check_run_as_root(containers)) == 0

def test_missing_security_context_no_false_positive():
    # FIX: was previously flagged incorrectly due to default=0 bug
    containers = [{"name": "app"}]
    assert len(check_run_as_root(containers)) == 0

def test_privileged_detected():
    containers = [{"name": "app", "securityContext": {"privileged": True}}]
    issues = check_privileged(containers)
    assert len(issues) == 1
    assert issues[0]["severity"] == "HIGH"

def test_not_privileged_passes():
    containers = [{"name": "app", "securityContext": {"privileged": False}}]
    assert len(check_privileged(containers)) == 0

def test_host_network_detected():
    assert len(check_host_network({"hostNetwork": True})) == 1

def test_no_host_network_passes():
    assert len(check_host_network({})) == 0