pipeline {
    agent any

    environment {
        DOCKER_USERNAME = "souravsrinivas2912"
        BACKEND_IMAGE = "souravsrinivas2912/raglens-backend:latest"
        FRONTEND_IMAGE = "souravsrinivas2912/raglens-frontend:latest"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                url: 'https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO.git'
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {

                    sh '''
                    echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    '''
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                sh '''
                docker build -t $BACKEND_IMAGE ./backend
                '''
            }
        }

        stage('Push Backend Image') {
            steps {
                sh '''
                docker push $BACKEND_IMAGE
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh '''
                docker build -t $FRONTEND_IMAGE ./frontend
                '''
            }
        }

        stage('Push Frontend Image') {
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

        success {
            echo 'Docker images built and pushed successfully!'
        }

        failure {
            echo 'Pipeline failed!'
        }
    }
}
