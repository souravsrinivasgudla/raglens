pipeline {
    agent any

    environment {
        DOCKER_USERNAME = "souravsrinivas2912"
        DOCKER_PASSWORD = credentials('dockerhub-password')

        BACKEND_IMAGE = "souravsrinivas2912/raglens-backend:latest"
        FRONTEND_IMAGE = "souravsrinivas2912/raglens-frontend:latest"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                url: 'https://github.com/YOUR_USERNAME/YOUR_REPO.git'
            }
        }

        stage('Docker Login') {
            steps {
                sh '''
                echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
                '''
            }
        }

        stage('Build Backend') {
            steps {
                sh '''
                docker build -t $BACKEND_IMAGE ./backend
                '''
            }
        }

        stage('Push Backend') {
            steps {
                sh '''
                docker push $BACKEND_IMAGE
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                docker build -t $FRONTEND_IMAGE ./frontend
                '''
            }
        }

        stage('Push Frontend') {
            steps {
                sh '''
                docker push $FRONTEND_IMAGE
                '''
            }
        }
    }

    post {
        always {
            sh 'docker logout'
        }
    }
}
