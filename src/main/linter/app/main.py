from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yaml
from .checks import security, resources, best_practices
from .scorer import calculate_score
app = FastAPI(title="Helm Chart Linter", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
def extract_containers(chart_dict: dict) -> list:
    return (
        chart_dict
        .get("spec", {})
        .get("template", {})
        .get("spec", {})
        .get("containers", [])
    )
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "linter"}
@app.post("/lint")
async def lint_chart(file: UploadFile = File(...)):
    if not file.filename.endswith((".yaml", ".yml")):
        raise HTTPException(status_code=400, detail="Only .yaml/.yml files are accepted")
    try:
        content = await file.read()
        chart_dict = yaml.safe_load(content)
    except yaml.YAMLError as e:
        raise HTTPException(status_code=422, detail=f"Invalid YAML: {str(e)}")
    containers = extract_containers(chart_dict)
    spec = chart_dict.get("spec", {}).get("template", {}).get("spec", {})
    issues = []
    issues += security.check_run_as_root(containers)
    issues += security.check_privileged(containers)
    issues += security.check_host_network(spec)
    issues += resources.check_resource_limits(containers)
    issues += best_practices.check_image_tag(containers)
    issues += best_practices.check_probes(containers)
    summary = calculate_score(issues)
    return {
        "chart_name": chart_dict.get("metadata", {}).get("name", "unknown"),
        "kind": chart_dict.get("kind", "unknown"),
        "summary": summary,
        "issues": issues
    }