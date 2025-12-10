# 🚀 Kubernetes Deployment Guide — Event Ticketing & Seat Reservation

This guide explains how to deploy all microservices (User, Catalog, Seating, Order, Payment) with their databases on **Minikube**, using Kubernetes YAML manifests.

---

## 🧩 Prerequisites

* **Minikube** installed and running
* **kubectl** configured
* **Docker** installed
* **At least 8 GB RAM and 4 CPUs** available for Minikube

---

## ⚙️ Step 1: Start Minikube

```bash
minikube start --cpus=4 --memory=7680
```

Verify Minikube is active:

```bash
minikube status
```

If you stop later:

```bash
minikube stop
```

---

## 🧱 Step 2: Create Namespace and Use It

All services will run in the `event-app` namespace.

```bash
kubectl create namespace event-app
kubectl config set-context --current --namespace=event-app
```

---

## 🐳 Step 3: Build Docker Images Inside Minikube

Point Docker to Minikube’s internal Docker daemon (so Kubernetes can find the images):

```bash
eval $(minikube docker-env)
```

Then build all service images:

```bash
docker build -t user-service:latest ./user-service
docker build -t catalog-service:latest ./catalog-service
docker build -t seating-service:latest ./seating-service
docker build -t order-service:latest ./order-service
docker build -t payment-service:latest ./payment-service
```

Verify:

```bash
docker images | grep service
```

---

## 🗄️ Step 4: Deploy Databases

Apply your database manifests **in order**:

```bash
kubectl apply -f k8s/userdb.yaml -n event-app
kubectl apply -f k8s/catalogdb.yaml -n event-app
kubectl apply -f k8s/seatingdb.yaml -n event-app
kubectl apply -f k8s/orderdb.yaml -n event-app
kubectl apply -f k8s/paymentdb.yaml -n event-app
```

Wait for them to become ready:

```bash
kubectl get pods
```

Optional (wait with timeout):

```bash
kubectl wait --for=condition=ready pod -l app=userdb --timeout=180s
```

---

## 🧠 Step 5: Deploy Microservices

```bash
kubectl apply -f k8s/user-service.yaml -n event-app
kubectl apply -f k8s/catalog-service.yaml -n event-app
kubectl apply -f k8s/seating-service.yaml -n event-app
kubectl apply -f k8s/order-service.yaml -n event-app
kubectl apply -f k8s/payment-service.yaml -n event-app
```

Check that all pods are running:

```bash
kubectl get pods
```

---

## 🧭 Step 6: Verify Deployments and Services

List deployments:

```bash
kubectl get deployments -n event-app
```

List services:

```bash
kubectl get svc -n event-app
```

Example output:

```
NAME              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
user-service      NodePort    10.100.236.158   <none>        8081:30085/TCP   2m
catalog-service   NodePort    10.96.42.50      <none>        4001:30081/TCP   2m
order-service     NodePort    10.104.95.133    <none>        4003:30082/TCP   2m
payment-service   NodePort    10.102.49.209    <none>        4004:30083/TCP   2m
seating-service   NodePort    10.98.177.202    <none>        8082:30084/TCP   2m
```

---

## 🌐 Step 7: Access Your Services

### Option A — Recommended (macOS / Windows / Docker driver)

Use `minikube service` to create a local tunnel:

```bash
minikube service user-service -n event-app --url
minikube service catalog-service -n event-app --url
minikube service order-service -n event-app --url
minikube service seating-service -n event-app --url
minikube service payment-service -n event-app --url
```

Example:

```
http://127.0.0.1:57656
```

> ⚠️ **Keep the terminal open** while this command is running — it keeps the tunnel active.

---

### Option B — Using NodePort (only works with Hyper-V / VirtualBox drivers)

If your Minikube driver supports NodePort networking:

```bash
minikube ip
# Example: 192.168.49.2
```

Then access:

```
http://192.168.49.2:30081  (Catalog)
http://192.168.49.2:30082  (Order)
http://192.168.49.2:30083  (Payment)
http://192.168.49.2:30084  (Seating)
http://192.168.49.2:30085  (User)
```

---

### Option C — Port Forward (safe, universal)

```bash
kubectl -n event-app port-forward svc/user-service 8081:8081 &
kubectl -n event-app port-forward svc/order-service 4003:4003 &
kubectl -n event-app port-forward svc/catalog-service 4001:4001 &
```

Then test:

```bash
curl http://localhost:8081/actuator/health
```

---

## 🧪 Step 8: Testing API Endpoints

```bash
MINIKUBE_IP=$(minikube ip)

# Register a user
curl -X POST http://$MINIKUBE_IP:30085/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "city": "New York"
  }'
```

---

## 🔍 Step 9: Debugging & Monitoring

Check logs:

```bash
kubectl -n event-app logs -l app=user-service --tail=100 -f
```

Describe a pod:

```bash
kubectl -n event-app describe pod <pod-name>
```

Monitor resource usage:

```bash
kubectl top pods
kubectl top nodes
```

---

## 🧰 Step 10: Useful Extras

### Scale a deployment

```bash
kubectl scale deployment user-service --replicas=3 -n event-app
```

### Open Kubernetes dashboard

```bash
minikube dashboard
```

### Delete all resources

```bash
kubectl delete all --all -n event-app
```

### Delete cluster completely

```bash
minikube stop
minikube delete
```

---

## 🧭 Notes for macOS & Windows users

| Driver            | NodePort Reachable? | Recommended Access                                 |
| ----------------- | ------------------- | -------------------------------------------------- |
| Docker (default)  | ❌ No                | `minikube service --url` or `kubectl port-forward` |
| Hyperkit (macOS)  | ✅ Yes               | `http://<minikube ip>:nodePort`                    |
| Hyper-V (Windows) | ✅ Yes               | `http://<minikube ip>:nodePort`                    |
| VirtualBox        | ✅ Yes               | `http://<minikube ip>:nodePort`                    |
| WSL2              | ⚠️ Partially        | Use `minikube service --url`                       |

---

## 🧹 Cleanup

To delete everything cleanly:

```bash
kubectl delete -f k8s/ -n event-app
minikube stop
minikube delete
```

---

## 💡 Pro Tips

1. Always run `eval $(minikube docker-env)` before building Docker images.
2. Check pods with `kubectl get pods -A` if they seem missing.
3. Use readiness and liveness probes in YAML for automatic restart handling.
4. Use `minikube service --url` for simple local API testing on macOS/Windows.
5. For direct NodePort access, use `--driver=hyperkit` (macOS) or `--driver=hyperv` (Windows).
