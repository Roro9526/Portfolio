# 🚢 Déploiement Loup-Garou sur Kubernetes (avec Ingress)

Ce dossier contient tout le nécessaire pour déployer le projet avec un routage avancé (Ingress).

## 📋 Pré-requis
- **Docker Desktop** (avec Kubernetes activé) ou **Minikube**.
- **Nginx Ingress Controller** doit être activé !
  - *Docker Desktop* : Installé via Helm ou manifeste (voir doc officielle).
  - *Minikube* : `minikube addons enable ingress`.
- `kubectl` installé.

## 🚀 Étapes de déploiement

### 1. Construire les images
```powershell
docker build -t loup-garou-backend:latest ./backend
docker build -t loup-garou-frontend:latest ./frontend
```

### 2. Appliquer les manifests
Dans l'ordre :
```powershell
# 1. Base de données
kubectl apply -f k8s/mongo-statefulset.yaml

# 2. Services (Réseau interne)
kubectl apply -f k8s/services.yaml

# 3. Applications (Backend & Frontend)
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# 4. Ingress (Routage Externe)
kubectl apply -f k8s/ingress.yaml
```

### 3. Configuration DNS (Indispensable !)
Pour que l'adresse `loup-garou.local` fonctionne, vous devez l'ajouter à votre fichier hosts.

**Windows** (`C:\Windows\System32\drivers\etc\hosts`) :
Ouvrez le fichier en Administrateur et ajoutez :
```text
127.0.0.1 loup-garou.local
```

### 4. Accès au jeu
Rendez-vous sur : 👉 **[http://loup-garou.local](http://loup-garou.local)**

(Le trafic sera automatiquement redirigé vers le frontend ou le backend selon besoin).

## 🧹 Nettoyage
```powershell
kubectl delete -f k8s/
```
