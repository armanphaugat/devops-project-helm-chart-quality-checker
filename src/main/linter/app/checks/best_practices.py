"""
Best practice checks for Helm chart configurations.
"""

def check_image_tag(containers: list) -> list:
    """Warn if :latest tag is used — unpredictable deployments."""
    issues = []
    for container in containers:
        image = container.get("image", "")
        if image.endswith(":latest") or ":" not in image:
            issues.append({
                "severity": "LOW",
                "rule": "LATEST_IMAGE_TAG",
                "message": f"Container '{container.get('name', 'unknown')}' uses ':latest' or no tag",
                "fix": "Pin to a specific image version like nginx:1.25.3"
            })
    return issues


def check_probes(containers: list) -> list:
    """Check if liveness and readiness probes are defined."""
    issues = []
    for container in containers:
        name = container.get("name", "unknown")
        if not container.get("livenessProbe"):
            issues.append({
                "severity": "MEDIUM",
                "rule": "NO_LIVENESS_PROBE",
                "message": f"Container '{name}' has no livenessProbe defined",
                "fix": "Add livenessProbe to enable automatic restart on failure"
            })
        if not container.get("readinessProbe"):
            issues.append({
                "severity": "MEDIUM",
                "rule": "NO_READINESS_PROBE",
                "message": f"Container '{name}' has no readinessProbe defined",
                "fix": "Add readinessProbe so traffic only routes to healthy pods"
            })
    return issues