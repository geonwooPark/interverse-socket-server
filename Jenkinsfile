pipeline {
  agent any

  environment {
    IMAGE_NAME = 'ventileco/interverse-socket-server:alpha'
    DOCKER_FILE = 'Dockerfile.alpha'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Docker Login & Build Image') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-hub-cred', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh '''
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
            docker build -f $DOCKER_FILE -t $IMAGE_NAME .
            docker push $IMAGE_NAME
          '''
        }
      }
    }

    stage('Trigger Infra Deploy') {
      steps {
        sshagent(['macmini-git-key']) {
          withCredentials([usernamePassword(credentialsId: 'docker-hub-cred', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
            sh """
              ssh -o StrictHostKeyChecking=no geonwoo@geonwooui-Macmini.local \\
              "export PATH=\\\$PATH:/usr/local/bin && \\
              echo \\"$DOCKER_PASS\\" | docker login -u \\"$DOCKER_USER\\" --password-stdin && \\
              cd desktop/project/nginx && \\
              docker-compose -f docker-compose.service.yml pull interverse-socket && \\
              docker-compose -f docker-compose.service.yml up -d interverse-socket"
            """
          }
        }
      }
    }
  }
}
